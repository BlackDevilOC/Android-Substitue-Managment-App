import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface SendMessageProps {
  teachers: Array<{ name: string; phone: string }>;
}

const SendMessage: React.FC<SendMessageProps> = ({ teachers }) => {
  const [message, setMessage] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (selectedTeachers.length === 0) {
      toast.error('Please select at least one teacher');
      return;
    }

    try {
      setIsSending(true);

      // Create SMS links for each selected teacher
      for (const teacherId of selectedTeachers) {
        const teacher = teachers.find(t => t.phone === teacherId);
        if (teacher && teacher.phone) {
          // Create SMS deep link with proper formatting for mobile
          const encodedMessage = encodeURIComponent(message);
          const smsLink = `sms:${teacher.phone}?body=${encodedMessage}`;
          
          try {
            // Try to open native SMS app
            const linkElement = document.createElement('a');
            linkElement.href = smsLink;
            linkElement.target = '_blank';
            linkElement.rel = 'noopener noreferrer';
            linkElement.click();

            // Record the sending attempt
            await fetch('/api/send-messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                teachers: [{ id: teacher.phone, name: teacher.name }],
                message,
                method: 'native'
              }),
            });

            // Small delay between opening multiple SMS apps
            if (selectedTeachers.length > 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            console.error('Error opening SMS for', teacher.name, error);
            toast.error(`Failed to open SMS for ${teacher.name}`);
          }
        }
      }

      toast.success(
        selectedTeachers.length === 1 
          ? 'SMS app opened' 
          : `SMS apps opened for ${selectedTeachers.length} teachers`
      );
      setMessage('');
      setSelectedTeachers([]);
    } catch (error) {
      console.error('Error sending messages:', error);
      toast.error('Failed to send messages');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Send Messages</h3>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">Select Teachers</label>
        <div className="max-h-40 overflow-y-auto space-y-2">
          {teachers.map((teacher) => (
            <div key={teacher.phone} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={teacher.phone}
                checked={selectedTeachers.includes(teacher.phone)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTeachers([...selectedTeachers, teacher.phone]);
                  } else {
                    setSelectedTeachers(selectedTeachers.filter(id => id !== teacher.phone));
                  }
                }}
                className="rounded border-gray-300"
              />
              <label htmlFor={teacher.phone} className="text-sm">
                {teacher.name} ({teacher.phone})
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Message</label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message here..."
          className="min-h-[100px]"
        />
      </div>

      <Button 
        onClick={handleSendMessage}
        disabled={!message.trim() || selectedTeachers.length === 0 || isSending}
      >
        {isSending ? 'Opening SMS App...' : 'Send Messages'}
      </Button>
    </div>
  );
};

export default SendMessage; 