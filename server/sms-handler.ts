import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { SMSHistoryEntry } from './types/substitute';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function sendSMS(phoneNumber: string, message: string, method: string = 'native'): Promise<boolean> {
  try {
    // Create SMS deep link for native SMS app
    const encodedMessage = encodeURIComponent(message);
    const smsLink = `sms:${phoneNumber}?body=${encodedMessage}`;

    // Add to history
    addSMSToHistory({
      teacherId: phoneNumber,
      teacherName: phoneNumber, // Using phone number as name for history
      message,
      status: 'pending',
      method: 'native'
    });

    // Return the SMS link that will be used by the frontend
    return true;
  } catch (error) {
    console.error('Error preparing SMS:', error);
    return false;
  }
}

export function getSMSLink(phoneNumber: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `sms:${phoneNumber}?body=${encodedMessage}`;
}

export function loadSMSHistory(): SMSHistoryEntry[] {
  try {
    const historyPath = path.join(__dirname, '../data/sms_history.json');
    if (!fs.existsSync(historyPath)) {
      return [];
    }
    const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    // Convert any timestamp fields to sentAt for consistency
    return history.map((entry: any) => ({
      ...entry,
      sentAt: entry.sentAt || entry.timestamp
    }));
  } catch (error) {
    console.error('Error loading SMS history:', error);
    return [];
  }
}

export function addSMSToHistory(entry: Omit<SMSHistoryEntry, 'id' | 'sentAt'>): SMSHistoryEntry {
  const history = loadSMSHistory();
  const newEntry: SMSHistoryEntry = {
    id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    sentAt: new Date().toISOString(),
    ...entry
  };
  
  history.push(newEntry);
  saveSMSHistory(history);
  return newEntry;
}

export function saveSMSHistory(history: SMSHistoryEntry[]): void {
  try {
    const historyPath = path.join(__dirname, '../data/sms_history.json');
    // Ensure all entries use sentAt instead of timestamp
    const updatedHistory = history.map(entry => ({
      ...entry,
      sentAt: entry.sentAt || entry.timestamp
    }));
    fs.writeFileSync(historyPath, JSON.stringify(updatedHistory, null, 2));
  } catch (error) {
    console.error('Error saving SMS history:', error);
  }
}

export function getSMSHistory(): SMSHistoryEntry[] {
  return loadSMSHistory();
}

import { Teacher } from '@shared/schema';