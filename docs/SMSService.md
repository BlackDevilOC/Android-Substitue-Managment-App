# SMSService Documentation

## Overview

The `SMSService` provides SMS messaging capabilities for the mobile application, utilizing the device's native SMS functionality. It handles message sending, queuing of failed messages for retry, tracking of SMS history, and fallback mechanisms.

## Purpose

The primary functions of the `SMSService` are:

1. Send SMS messages through the device's native SMS functionality
2. Queue messages that fail to send for later retry
3. Maintain a history of sent messages
4. Provide fallback methods (SMS links) when direct sending fails
5. Track message delivery status

## Implementation

### Class Structure

The `SMSService` is implemented as a static class with the following structure:

```typescript
export class SMSService {
  private static readonly QUEUE_KEY = 'sms_queue';
  private static readonly HISTORY_KEY = 'sms_history';
  private static readonly MAX_RETRY_ATTEMPTS = 3;

  static async sendSMS(phoneNumber: string, message: string, teacherId: string = '', teacherName: string = '') { ... }
  private static async queueMessage(phoneNumber: string, message: string, teacherId: string = '', teacherName: string = '') { ... }
  private static async getQueue(): Promise<QueuedMessage[]> { ... }
  static async processQueue() { ... }
  private static async recordSMSHistory(teacherId: string, teacherName: string, message: string, status: 'pending' | 'sent' | 'failed', method: string) { ... }
  static async getHistory(): Promise<SMSHistoryEntry[]> { ... }
  static async clearHistory() { ... }
  static async getPendingCount(): Promise<number> { ... }
  static getSMSLink(phoneNumber: string, message: string): string { ... }
}
```

### Interface Definitions

```typescript
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
```

### Sending SMS Messages

The service provides a method to send SMS messages through the device's native SMS functionality:

```typescript
static async sendSMS(phoneNumber: string, message: string, teacherId: string = '', teacherName: string = '') {
  try {
    // First check if we have SMS permissions
    const hasPermission = await checkSMSPermissions();
    
    if (hasPermission) {
      // Try to send SMS using native functionality
      const success = await sendSMS(phoneNumber, message);
      
      // Record the result in history
      await this.recordSMSHistory(
        teacherId,
        teacherName,
        message,
        success ? 'sent' : 'failed',
        'native'
      );
      
      if (!success) {
        // If sending failed, queue for later retry
        await this.queueMessage(phoneNumber, message, teacherId, teacherName);
      }
      
      return success;
    } else {
      // If we don't have permissions, try to request them
      const granted = await requestSMSPermissions();
      
      if (granted) {
        // If permissions were granted, try sending again
        return this.sendSMS(phoneNumber, message, teacherId, teacherName);
      } else {
        // If permissions weren't granted, queue the message and record in history
        await this.queueMessage(phoneNumber, message, teacherId, teacherName);
        await this.recordSMSHistory(
          teacherId,
          teacherName,
          message,
          'pending',
          'queued'
        );
        return false;
      }
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // On error, queue message and record in history
    await this.queueMessage(phoneNumber, message, teacherId, teacherName);
    await this.recordSMSHistory(
      teacherId,
      teacherName,
      message,
      'failed',
      'error'
    );
    return false;
  }
}
```

### Message Queuing

Failed messages are queued for later retry:

```typescript
private static async queueMessage(phoneNumber: string, message: string, teacherId: string = '', teacherName: string = '') {
  try {
    // Get current queue
    const queue = await this.getQueue();
    
    // Create new queued message
    const queuedMessage: QueuedMessage = {
      phoneNumber,
      message,
      timestamp: Date.now(),
      attempts: 0,
      teacherId,
      teacherName
    };
    
    // Add to queue and save
    queue.push(queuedMessage);
    await storeData(this.QUEUE_KEY, queue);
    
    console.log('Message queued for later sending');
  } catch (error) {
    console.error('Error queuing message:', error);
  }
}
```

### Queue Processing

The service provides a method to process the queue of pending messages:

```typescript
static async processQueue() {
  try {
    // Get current queue
    const queue = await this.getQueue();
    
    if (queue.length === 0) {
      return;
    }
    
    console.log(`Processing SMS queue, ${queue.length} messages pending`);
    
    // Process each message in the queue
    const updatedQueue: QueuedMessage[] = [];
    
    for (const message of queue) {
      // Increment attempt counter
      message.attempts++;
      
      if (message.attempts <= this.MAX_RETRY_ATTEMPTS) {
        // Try to send the message
        const success = await sendSMS(message.phoneNumber, message.message);
        
        // Record the result in history
        await this.recordSMSHistory(
          message.teacherId,
          message.teacherName,
          message.message,
          success ? 'sent' : 'failed',
          'retry'
        );
        
        if (!success) {
          // If sending failed, keep in queue for another try
          updatedQueue.push(message);
        }
      } else {
        // If max attempts reached, record final failure
        await this.recordSMSHistory(
          message.teacherId,
          message.teacherName,
          message.message,
          'failed',
          'max_attempts'
        );
      }
    }
    
    // Save updated queue
    await storeData(this.QUEUE_KEY, updatedQueue);
    
    console.log(`Queue processed, ${updatedQueue.length} messages remaining`);
  } catch (error) {
    console.error('Error processing SMS queue:', error);
  }
}
```

### SMS History Tracking

The service maintains a history of sent messages:

```typescript
private static async recordSMSHistory(
  teacherId: string,
  teacherName: string,
  message: string,
  status: 'pending' | 'sent' | 'failed',
  method: string
) {
  try {
    // Get current history
    const history = await this.getHistory();
    
    // Create new history entry
    const entry: SMSHistoryEntry = {
      id: Date.now().toString(),
      teacherId,
      teacherName,
      message,
      timestamp: new Date().toISOString(),
      status,
      method
    };
    
    // Add to history and save
    history.push(entry);
    await storeData(this.HISTORY_KEY, history);
  } catch (error) {
    console.error('Error recording SMS history:', error);
  }
}
```

### SMS Link Fallback

The service provides a fallback method for sending SMS via a link:

```typescript
static getSMSLink(phoneNumber: string, message: string): string {
  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Create SMS link
  return `sms:${phoneNumber}?body=${encodedMessage}`;
}
```

## Usage Example

Here's a complete example of how to use the SMSService:

```typescript
import { SMSService } from 'src/services/SMSService';

// Component for sending SMS
function SMSSender() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<'success' | 'failure' | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Load pending message count when component mounts
  useEffect(() => {
    async function loadPendingCount() {
      const count = await SMSService.getPendingCount();
      setPendingCount(count);
    }
    
    loadPendingCount();
  }, []);

  // Send an SMS
  async function handleSendSMS() {
    if (!phoneNumber || !message) {
      return;
    }
    
    setSending(true);
    
    try {
      const success = await SMSService.sendSMS(
        phoneNumber,
        message,
        'teacher-123', // Example teacher ID
        'John Doe'     // Example teacher name
      );
      
      setResult(success ? 'success' : 'failure');
      
      // Update pending count
      const count = await SMSService.getPendingCount();
      setPendingCount(count);
    } catch (err) {
      console.error('Error sending SMS:', err);
      setResult('failure');
    } finally {
      setSending(false);
    }
  }

  // Process the queue of pending messages
  async function handleProcessQueue() {
    setSending(true);
    
    try {
      await SMSService.processQueue();
      
      // Update pending count
      const count = await SMSService.getPendingCount();
      setPendingCount(count);
    } catch (err) {
      console.error('Error processing queue:', err);
    } finally {
      setSending(false);
    }
  }

  // Get SMS link as fallback
  function getSMSLink() {
    return SMSService.getSMSLink(phoneNumber, message);
  }

  return (
    <div>
      <h2>Send SMS</h2>
      
      <div>
        <label>Phone Number:</label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>
      
      <div>
        <label>Message:</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      
      <button onClick={handleSendSMS} disabled={sending}>
        {sending ? 'Sending...' : 'Send SMS'}
      </button>
      
      {pendingCount > 0 && (
        <div>
          <p>{pendingCount} messages pending</p>
          <button onClick={handleProcessQueue} disabled={sending}>
            Retry Pending Messages
          </button>
        </div>
      )}
      
      {result === 'failure' && (
        <div>
          <p>Sending failed. Try SMS link instead:</p>
          <a href={getSMSLink()}>Open SMS App</a>
        </div>
      )}
    </div>
  );
}
```

## SMS History Viewer

The service also provides methods to view and manage the SMS history:

```typescript
function SMSHistoryViewer() {
  const [history, setHistory] = useState<SMSHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load SMS history when component mounts
  useEffect(() => {
    async function loadHistory() {
      try {
        const entries = await SMSService.getHistory();
        setHistory(entries);
      } catch (err) {
        console.error('Error loading SMS history:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadHistory();
  }, []);

  // Clear SMS history
  async function handleClearHistory() {
    if (confirm('Are you sure you want to clear the SMS history?')) {
      try {
        await SMSService.clearHistory();
        setHistory([]);
      } catch (err) {
        console.error('Error clearing SMS history:', err);
      }
    }
  }

  if (loading) {
    return <div>Loading history...</div>;
  }

  return (
    <div>
      <h2>SMS History</h2>
      
      {history.length === 0 ? (
        <p>No SMS history found.</p>
      ) : (
        <>
          <button onClick={handleClearHistory}>Clear History</button>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Teacher</th>
                <th>Message</th>
                <th>Status</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.timestamp).toLocaleString()}</td>
                  <td>{entry.teacherName}</td>
                  <td>{entry.message}</td>
                  <td>{entry.status}</td>
                  <td>{entry.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
```

## Error Handling

The service includes comprehensive error handling for all operations:

1. **SMS Permission Handling**
   ```typescript
   // Check if we have permissions
   const hasPermission = await checkSMSPermissions();
   
   if (!hasPermission) {
     // Try to request permissions
     const granted = await requestSMSPermissions();
     
     if (!granted) {
       // Handle case where permissions are denied
     }
   }
   ```

2. **Message Sending Failures**
   ```typescript
   try {
     // Try to send SMS
     const success = await sendSMS(phoneNumber, message);
     
     if (!success) {
       // Queue for later retry
       await this.queueMessage(phoneNumber, message);
     }
   } catch (error) {
     // Handle unexpected errors
     console.error('Error sending SMS:', error);
     
     // Queue for later retry
     await this.queueMessage(phoneNumber, message);
   }
   ```

3. **Queue Persistence**
   ```typescript
   try {
     // Save queue to persistent storage
     await storeData(this.QUEUE_KEY, queue);
   } catch (error) {
     console.error('Error saving queue:', error);
   }
   ```

## Conclusion

The `SMSService` provides comprehensive SMS functionality for mobile applications with:

1. Native SMS sending capabilities
2. Permission handling for SMS operations
3. Queuing mechanism for failed messages
4. Retry logic with attempt limiting
5. SMS history tracking
6. Fallback methods for SMS functionality
7. Clean integration with the rest of the application

This service ensures that SMS notifications can be reliably sent, even in challenging network conditions or when users have temporarily denied permissions.