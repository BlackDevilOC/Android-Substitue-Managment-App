import { storeData, getData } from '../utils/asyncStorage';
import { sendSMS as sendSMSNative } from '../utils/sms';

// Interface for SMS queue entries
interface QueuedMessage {
  phoneNumber: string;
  message: string;
  timestamp: number;
  attempts: number;
}

export class SMSService {
  private static readonly QUEUE_KEY = 'sms_queue';
  private static readonly MAX_RETRY_ATTEMPTS = 3;

  /**
   * Send an SMS message through the device
   * If sending fails, the message will be queued for later attempts
   */
  static async sendSMS(phoneNumber: string, message: string) {
    try {
      console.log(`[SMSService] Attempting to send SMS to ${phoneNumber}`);
      
      const sent = await sendSMSNative(phoneNumber, message);
      
      if (sent) {
        console.log(`[SMSService] Successfully sent SMS to ${phoneNumber}`);
        return true;
      } else {
        console.log(`[SMSService] Failed to send SMS to ${phoneNumber}, queueing for later`);
        await this.queueMessage(phoneNumber, message);
        return false;
      }
    } catch (error) {
      console.error(`[SMSService] Error sending SMS to ${phoneNumber}:`, error);
      await this.queueMessage(phoneNumber, message);
      return false;
    }
  }

  /**
   * Queue a message for later sending
   */
  private static async queueMessage(phoneNumber: string, message: string) {
    try {
      const queue = await this.getQueue();
      
      queue.push({
        phoneNumber,
        message,
        timestamp: Date.now(),
        attempts: 0
      });
      
      await storeData(this.QUEUE_KEY, queue);
      console.log(`[SMSService] Queued message for ${phoneNumber}, queue size: ${queue.length}`);
      
      return true;
    } catch (error) {
      console.error('[SMSService] Error queueing message:', error);
      return false;
    }
  }

  /**
   * Get the current message queue
   */
  private static async getQueue() {
    try {
      const queue = await getData(this.QUEUE_KEY);
      return Array.isArray(queue) ? queue : [];
    } catch (error) {
      console.error('[SMSService] Error getting message queue:', error);
      return [];
    }
  }

  /**
   * Process the message queue, attempting to send queued messages
   */
  static async processQueue() {
    try {
      const queue = await this.getQueue();
      
      if (queue.length === 0) {
        return;
      }
      
      console.log(`[SMSService] Processing message queue, size: ${queue.length}`);
      
      const newQueue: QueuedMessage[] = [];
      
      for (const item of queue) {
        // Skip if too many attempts
        if (item.attempts >= this.MAX_RETRY_ATTEMPTS) {
          console.log(`[SMSService] Dropping message to ${item.phoneNumber} after ${item.attempts} failed attempts`);
          continue;
        }
        
        // Try to send
        const sent = await sendSMSNative(item.phoneNumber, item.message);
        
        if (sent) {
          console.log(`[SMSService] Successfully sent queued message to ${item.phoneNumber}`);
        } else {
          // Increment attempts and keep in queue
          item.attempts++;
          newQueue.push(item);
          console.log(`[SMSService] Failed to send queued message to ${item.phoneNumber}, attempts: ${item.attempts}`);
        }
      }
      
      // Save updated queue
      await storeData(this.QUEUE_KEY, newQueue);
      console.log(`[SMSService] Queue processing complete, new size: ${newQueue.length}`);
      
      return newQueue.length;
    } catch (error) {
      console.error('[SMSService] Error processing message queue:', error);
      return -1;
    }
  }
}