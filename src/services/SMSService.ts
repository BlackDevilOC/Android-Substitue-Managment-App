import { SMS } from '@capacitor/sms';
import { Storage } from '@capacitor/storage';

export class SMSService {
  private static readonly QUEUE_KEY = 'sms_queue';

  static async sendSMS(phoneNumber: string, message: string) {
    try {
      // Try to send SMS directly
      await SMS.send({
        numbers: [phoneNumber],
        text: message
      });
    } catch (error) {
      // If offline, queue the message
      await this.queueMessage(phoneNumber, message);
    }
  }

  private static async queueMessage(phoneNumber: string, message: string) {
    const queue = await this.getQueue();
    queue.push({ phoneNumber, message, timestamp: new Date().toISOString() });
    await Storage.set({
      key: this.QUEUE_KEY,
      value: JSON.stringify(queue)
    });
  }

  private static async getQueue() {
    const { value } = await Storage.get({ key: this.QUEUE_KEY });
    return value ? JSON.parse(value) : [];
  }

  static async processQueue() {
    const queue = await this.getQueue();
    for (const item of queue) {
      try {
        await SMS.send({
          numbers: [item.phoneNumber],
          text: item.message
        });
        // Remove from queue if successful
        const index = queue.indexOf(item);
        queue.splice(index, 1);
        await Storage.set({
          key: this.QUEUE_KEY,
          value: JSON.stringify(queue)
        });
      } catch (error) {
        console.error('Failed to send queued message:', error);
      }
    }
  }
} 