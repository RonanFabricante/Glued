'use client';

import { MessageWithSender } from '@/lib/supabase/types';
import { useEffect, useRef } from 'react';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll into view when message is rendered
    bubbleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div
      ref={bubbleRef}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
        {!isOwn && (
          <div className="text-xs text-calm-600 mb-1 px-2">
            {message.sender?.first_name || 'Unknown'}
          </div>
        )}
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwn
              ? 'bg-calm-900 text-white order-2'
              : 'bg-white border border-calm-200 text-calm-900 order-1'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div
          className={`text-xs text-calm-500 mt-1 px-2 flex items-center gap-1 ${
            isOwn ? 'justify-end order-1' : 'justify-start'
          }`}
        >
          <span>{formatTime(message.created_at)}</span>
          {isOwn && message.read_at && (
            <span className="text-green-600">✓✓</span>
          )}
          {isOwn && !message.read_at && (
            <span className="text-calm-400">✓</span>
          )}
        </div>
      </div>
    </div>
  );
}
