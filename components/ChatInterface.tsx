'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendMessage, getMessages, markAsRead } from '@/lib/actions/messages';
import { MessageWithSender } from '@/lib/supabase/types';
import MessageBubble from './MessageBubble';

interface ChatInterfaceProps {
  connectionId: string;
  currentUserId: string;
}

export default function ChatInterface({ connectionId, currentUserId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const result = await getMessages(connectionId);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setMessages(result.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await markAsRead(connectionId);
    } catch (err) {
      // Silently fail - not critical
      console.error('Failed to mark messages as read:', err);
    }
  };

  // Load initial messages
  useEffect(() => {
    loadMessages();
    markMessagesAsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`,
        },
        async (payload) => {
          // Fetch the new message with sender profile
          const newMessage = payload.new as any;
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMessage.sender_id)
            .single();

          const messageWithSender: MessageWithSender = {
            ...newMessage,
            sender: profile,
          };

          setMessages((prev) => [...prev, messageWithSender]);
          
          // Mark as read if it's not from current user
          if (newMessage.sender_id !== currentUserId) {
            markAsRead(connectionId);
          }

          // Scroll to bottom
          scrollToBottom();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          // Update message read status
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId, currentUserId, supabase]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || sending) return;

    setSending(true);
    setError('');

    try {
      const result = await sendMessage(connectionId, trimmedMessage);
      if (result.error) {
        setError(result.error);
      } else {
        setNewMessage('');
        // Message will be added via real-time subscription
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-8 text-calm-600">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="card p-0 flex flex-col" style={{ height: '600px' }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-calm-600">
            <p className="mb-2">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender_id === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSend} className="border-t border-calm-200 p-4">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 input-field resize-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
