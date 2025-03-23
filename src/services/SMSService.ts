import { storeData, getData, removeData } from '../utils/asyncStorage';
import { sendSMS as sendSMSNative, getSMSLink } from '../utils/sms';
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
      console.log(`[SMSService] Sending SMS to ${phoneNumber}`);
      
      // Try to send the message immediately
      const success = await sendSMSNative(phoneNumber, message);
      
      if (success) {
        console.log('[SMSService] Message sent successfully');
        
        // Record the successful send in history
        await this.recordSMSHistory(teacherId, teacherName, message, 'sent', 'native');
        
        return true;
      } else {
        console.log('[SMSService] Failed to send message, queuing for later');
        
        // Queue the message for later sending
        await this.queueMessage(phoneNumber, message, teacherId, teacherName);
        
        // Record the pending message in history
        await this.recordSMSHistory(teacherId, teacherName, message, 'pending', 'queue');
        
        return false;
      }
    } catch (error) {
      console.error('[SMSService] Error sending SMS:', error);
      
      // Queue the message for later sending
      await this.queueMessage(phoneNumber, message, teacherId, teacherName);
      
      // Record the failed message in history
      await this.recordSMSHistory(teacherId, teacherName, message, 'failed', 'queue');
      
      return false;
    }
  }
  
  /**
   * Queue a message for later sending
   */
  private static async queueMessage(phoneNumber: string, message: string, teacherId: string = '', teacherName: string = '') {
    try {
      // Get the current queue
      const queue = await this.getQueue();
      
      // Add the message to the queue
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
      await storeData(this.QUEUE_KEY, queue);
      
      console.log(`[SMSService] Queued message for ${phoneNumber}`);
    } catch (error) {
      console.error('[SMSService] Error queuing message:', error);
    }
  }
  
  /**
   * Get the current message queue
   */
  private static async getQueue(): Promise<QueuedMessage[]> {
    try {
      const queue = await getData(this.QUEUE_KEY);
      return Array.isArray(queue) ? queue : [];
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
      const queue = await this.getQueue();
      
      if (queue.length === 0) {
        console.log('[SMSService] Queue is empty');
        return;
      }
      
      console.log(`[SMSService] Found ${queue.length} queued messages`);
      
      // Process each message in the queue
      const updatedQueue: QueuedMessage[] = [];
      
      for (const message of queue) {
        // Increment the attempt counter
        message.attempts++;
        
        // Skip messages that have exceeded the retry limit
        if (message.attempts > this.MAX_RETRY_ATTEMPTS) {
          console.log(`[SMSService] Dropping message to ${message.phoneNumber} after ${message.attempts} attempts`);
          
          // Record the failed message in history
          await this.recordSMSHistory(
            message.teacherId,
            message.teacherName,
            message.message,
            'failed',
            'queue-expired'
          );
          
          continue;
        }
        
        // Try to send the message
        const success = await sendSMSNative(message.phoneNumber, message.message);
        
        if (success) {
          console.log(`[SMSService] Successfully sent queued message to ${message.phoneNumber}`);
          
          // Record the successful send in history
          await this.recordSMSHistory(
            message.teacherId,
            message.teacherName,
            message.message,
            'sent',
            'queue-retry'
          );
        } else {
          console.log(`[SMSService] Failed to send queued message to ${message.phoneNumber}, attempt ${message.attempts}`);
          
          // Keep the message in the queue for the next attempt
          updatedQueue.push(message);
        }
      }
      
      // Save the updated queue
      await storeData(this.QUEUE_KEY, updatedQueue);
      
      console.log(`[SMSService] Queue processing complete, ${updatedQueue.length} messages remaining`);
    } catch (error) {
      console.error('[SMSService] Error processing queue:', error);
    }
  }
  
  /**
   * Record SMS send history
   */
  private static async recordSMSHistory(
    teacherId: string,
    teacherName: string,
    message: string,
    status: 'pending' | 'sent' | 'failed',
    method: string
  ) {
    try {
      // Get the current history
      const history = await this.getHistory();
      
      // Create a new history entry
      const entry: SMSHistoryEntry = {
        id: uuidv4(),
        teacherId,
        teacherName,
        message,
        timestamp: new Date().toISOString(),
        status,
        method
      };
      
      // Add the entry to history
      history.unshift(entry); // Add to beginning of array
      
      // Limit history to 100 entries
      const limitedHistory = history.slice(0, 100);
      
      // Save the updated history
      await storeData(this.HISTORY_KEY, limitedHistory);
    } catch (error) {
      console.error('[SMSService] Error recording SMS history:', error);
    }
  }
  
  /**
   * Get SMS send history
   */
  static async getHistory(): Promise<SMSHistoryEntry[]> {
    try {
      const history = await getData(this.HISTORY_KEY);
      return Array.isArray(history) ? history : [];
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
      await storeData(this.HISTORY_KEY, []);
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
      const queue = await this.getQueue();
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