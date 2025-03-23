import { getData, storeData } from '../utils/asyncStorage';
import { sendSMS as sendDeviceSMS, getSMSLink } from '../utils/sms';
import { v4 as uuidv4 } from 'uuid';

interface QueuedMessage {
  phoneNumber: string;
  message: string;
  timestamp: number;
  attempts: number;
  teacherId: string;
  teacherName: string;
}

interface SMSHistoryEntry {
  id: string;
  teacherId: string;
  teacherName: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'failed';
  method: string;
}

/**
 * Service for sending and managing SMS messages on mobile devices
 */
export class SMSService {
  private static readonly QUEUE_KEY = 'sms_queue';
  private static readonly HISTORY_KEY = 'sms_history';
  private static readonly MAX_RETRY_ATTEMPTS = 3;

  /**
   * Send an SMS message through the device
   * If sending fails, the message will be queued for later attempts
   */
  static async sendSMS(phoneNumber: string, message: string, teacherId: string = '', teacherName: string = '') {
    try {
      console.log(`[SMSService] Sending message to ${phoneNumber}: ${message.substring(0, 30)}...`);
      
      // Try to send the message directly
      const success = await sendDeviceSMS(phoneNumber, message);
      
      if (success) {
        // Message was sent successfully
        console.log(`[SMSService] Message sent successfully to ${phoneNumber}`);
        
        // Record in history
        await SMSService.recordSMSHistory(phoneNumber, message, 'sent', 'direct', teacherId, teacherName);
        return true;
      } else {
        // Message failed to send, queue it for later
        console.log(`[SMSService] Failed to send message to ${phoneNumber}, queuing for later`);
        await SMSService.queueMessage(phoneNumber, message, teacherId, teacherName);
        
        // Record in history
        await SMSService.recordSMSHistory(phoneNumber, message, 'pending', 'queued', teacherId, teacherName);
        return false;
      }
    } catch (error) {
      console.error(`[SMSService] Error sending message to ${phoneNumber}:`, error);
      
      // Queue the message for later attempt
      await SMSService.queueMessage(phoneNumber, message, teacherId, teacherName);
      
      // Record in history
      await SMSService.recordSMSHistory(phoneNumber, message, 'pending', 'queued', teacherId, teacherName);
      return false;
    }
  }

  /**
   * Queue a message for later sending
   */
  private static async queueMessage(phoneNumber: string, message: string, teacherId: string = '', teacherName: string = '') {
    try {
      // Get the current queue
      const queue = await SMSService.getQueue();
      
      // Add the new message to the queue
      const queuedMessage: QueuedMessage = {
        phoneNumber,
        message,
        timestamp: Date.now(),
        attempts: 0,
        teacherId,
        teacherName
      };
      
      queue.push(queuedMessage);
      
      // Save the updated queue
      await storeData(SMSService.QUEUE_KEY, queue);
      
      console.log(`[SMSService] Message queued for ${phoneNumber}`);
    } catch (error) {
      console.error('[SMSService] Error queuing message:', error);
    }
  }

  /**
   * Get the current message queue
   */
  private static async getQueue(): Promise<QueuedMessage[]> {
    try {
      const queue = await getData(SMSService.QUEUE_KEY);
      return queue || [];
    } catch (error) {
      console.error('[SMSService] Error getting queue:', error);
      return [];
    }
  }

  /**
   * Process the message queue, attempting to send queued messages
   */
  static async processQueue() {
    try {
      console.log('[SMSService] Processing message queue');
      
      // Get the current queue
      const queue = await SMSService.getQueue();
      
      if (queue.length === 0) {
        console.log('[SMSService] Queue is empty, nothing to process');
        return;
      }
      
      console.log(`[SMSService] Found ${queue.length} messages in queue`);
      
      // Process each message in the queue
      const remainingMessages: QueuedMessage[] = [];
      
      for (const message of queue) {
        // Skip messages that have too many failed attempts
        if (message.attempts >= SMSService.MAX_RETRY_ATTEMPTS) {
          console.log(`[SMSService] Message to ${message.phoneNumber} has failed too many times, marking as failed`);
          await SMSService.recordSMSHistory(
            message.phoneNumber,
            message.message,
            'failed',
            'exceeded_attempts',
            message.teacherId,
            message.teacherName
          );
          continue;
        }
        
        // Try to send the message
        console.log(`[SMSService] Attempting to send queued message to ${message.phoneNumber} (attempt ${message.attempts + 1})`);
        
        const success = await sendDeviceSMS(message.phoneNumber, message.message);
        
        if (success) {
          // Message was sent successfully
          console.log(`[SMSService] Queued message sent successfully to ${message.phoneNumber}`);
          
          // Record in history
          await SMSService.recordSMSHistory(
            message.phoneNumber,
            message.message,
            'sent',
            'queue_retry',
            message.teacherId,
            message.teacherName
          );
        } else {
          // Message failed to send, increment attempts and keep in queue
          console.log(`[SMSService] Failed to send queued message to ${message.phoneNumber}`);
          
          message.attempts++;
          remainingMessages.push(message);
        }
      }
      
      // Save the updated queue
      await storeData(SMSService.QUEUE_KEY, remainingMessages);
      
      console.log(`[SMSService] Queue processing complete, ${remainingMessages.length} messages remaining`);
    } catch (error) {
      console.error('[SMSService] Error processing queue:', error);
    }
  }

  /**
   * Record SMS send history
   */
  private static async recordSMSHistory(
    phoneNumber: string,
    message: string,
    status: 'pending' | 'sent' | 'failed',
    method: string,
    teacherId: string,
    teacherName: string
  ) {
    try {
      const history = await SMSService.getHistory();
      
      const entry: SMSHistoryEntry = {
        id: uuidv4(),
        teacherId,
        teacherName,
        message,
        timestamp: new Date().toISOString(),
        status,
        method
      };
      
      history.unshift(entry); // Add to beginning of array
      
      // Limit history to last 100 entries
      if (history.length > 100) {
        history.length = 100;
      }
      
      await storeData(SMSService.HISTORY_KEY, history);
    } catch (error) {
      console.error('[SMSService] Error recording SMS history:', error);
    }
  }

  /**
   * Get SMS send history
   */
  static async getHistory(): Promise<SMSHistoryEntry[]> {
    try {
      const history = await getData(SMSService.HISTORY_KEY);
      return history || [];
    } catch (error) {
      console.error('[SMSService] Error getting history:', error);
      return [];
    }
  }

  /**
   * Clear SMS history
   */
  static async clearHistory() {
    try {
      await storeData(SMSService.HISTORY_KEY, []);
      console.log('[SMSService] SMS history cleared');
    } catch (error) {
      console.error('[SMSService] Error clearing history:', error);
    }
  }

  /**
   * Get the number of pending messages in the queue
   */
  static async getPendingCount(): Promise<number> {
    try {
      const queue = await SMSService.getQueue();
      return queue.length;
    } catch (error) {
      console.error('[SMSService] Error getting pending count:', error);
      return 0;
    }
  }

  /**
   * Get an SMS link for a given phone number and message
   */
  static getSMSLink(phoneNumber: string, message: string): string {
    return getSMSLink(phoneNumber, message);
  }
}