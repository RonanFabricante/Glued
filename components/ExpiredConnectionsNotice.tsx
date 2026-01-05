'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ExpiredConnectionsNotice() {
  const [isResolving, setIsResolving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAutoResolve = async () => {
    setIsResolving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all expired active connections
      const { data: expiredConnections } = await supabase
        .from('connections')
        .select('id')
        .eq('status', 'active')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .lt('expires_at', new Date().toISOString());

      if (expiredConnections && expiredConnections.length > 0) {
        // Auto-resolve all expired connections as timed_out
        const updates = expiredConnections.map((conn) =>
          supabase
            .from('connections')
            .update({
              status: 'timed_out',
              resolved_at: new Date().toISOString(),
            })
            .eq('id', conn.id)
        );

        await Promise.all(updates);
      }

      router.refresh();
    } catch (error) {
      console.error('Error auto-resolving:', error);
      setIsResolving(false);
    }
  };

  return (
    <div className="card bg-amber-50 border-amber-300 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-amber-900 mb-2">Time's up on a connection</h3>
          <p className="text-amber-800 text-sm mb-3">
            One or more of your connections has expired. They'll be marked as timed out.
          </p>
        </div>
      </div>
      <button
        onClick={handleAutoResolve}
        disabled={isResolving}
        className="btn-primary"
      >
        {isResolving ? 'Resolving...' : 'Mark as timed out'}
      </button>
    </div>
  );
}
