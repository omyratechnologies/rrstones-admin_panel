import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { userApi } from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import type { User } from '../../types';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface UserMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export default function UserMessageDialog({ open, onOpenChange, user }: UserMessageDialogProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { addNotification } = useNotifications();

  const sendMessageMutation = useMutation({
    mutationFn: ({ userId, subject, message }: { userId: string; subject: string; message: string }) =>
      userApi.sendMessage(userId, subject, message),
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: 'Message Sent',
        message: 'Your message has been sent successfully',
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Send Failed',
        message: error.response?.data?.message || 'Failed to send message',
      });
    },
  });

  const resetForm = () => {
    setSubject('');
    setMessage('');
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && user) {
      sendMessageMutation.mutate({
        userId: user._id,
        subject: subject.trim(),
        message: message.trim(),
      });
    }
  };

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Send Message to {user.name}</CardTitle>
          <p className="text-sm text-gray-600">
            Send a message to {user.email}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Subject */}
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">Subject *</label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (errors.subject) setErrors(prev => ({ ...prev, subject: '' }));
                }}
                placeholder="Enter message subject"
                className={errors.subject ? 'border-red-500' : ''}
              />
              {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">Message *</label>
              <textarea
                id="message"
                value={message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setMessage(e.target.value);
                  if (errors.message) setErrors(prev => ({ ...prev, message: '' }));
                }}
                placeholder="Enter your message"
                rows={6}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.message ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.message && <p className="text-sm text-red-500">{errors.message}</p>}
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  resetForm();
                }}
                disabled={sendMessageMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
