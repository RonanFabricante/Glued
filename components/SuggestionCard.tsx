'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/supabase/types';

interface SuggestionCardProps {
  suggestion: Profile;
  intentOverlap: string[];
  availabilityOverlap: string[];
}

export default function SuggestionCard({
  suggestion,
  intentOverlap,
  availabilityOverlap,
}: SuggestionCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleAccept = async () => {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14);

      const { error: insertError } = await supabase.from('connections').insert({
        user_a: user.id,
        user_b: suggestion.id,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      });

      if (insertError) {
        // Check if it's the capacity error
        if (insertError.message.includes('3 active connections')) {
          setError("You're at capacity. Resolve one connection to open a slot.");
          setLoading(false);
          return;
        }
        throw insertError;
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const handlePass = () => {
    router.push('/dashboard');
  };

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-calm-900 mb-2">{suggestion.first_name}</h2>
        {suggestion.area && <p className="text-lg text-calm-600">{suggestion.area}</p>}
      </div>

      {intentOverlap.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-calm-700 mb-2">Shared interests</h3>
          <div className="flex flex-wrap gap-2">
            {intentOverlap.map((intent) => (
              <span key={intent} className="chip">
                {intent}
              </span>
            ))}
          </div>
        </div>
      )}

      {suggestion.intent_types.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-calm-700 mb-2">
            {intentOverlap.length > 0 ? 'Also interested in' : 'Interested in'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {suggestion.intent_types
              .filter((intent) => !intentOverlap.includes(intent))
              .map((intent) => (
                <span key={intent} className="chip bg-white">
                  {intent}
                </span>
              ))}
          </div>
        </div>
      )}

      {availabilityOverlap.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-calm-700 mb-2">Availability overlap</h3>
          <div className="flex flex-wrap gap-2">
            {availabilityOverlap.map((slot) => (
              <span key={slot} className="chip">
                {slot}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-300 text-red-800 p-4 rounded-lg">
          <p className="font-semibold mb-1">Unable to accept</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button onClick={handlePass} disabled={loading} className="btn-secondary flex-1">
          Pass
        </button>
        <button onClick={handleAccept} disabled={loading} className="btn-primary flex-1">
          {loading ? 'Connecting...' : 'Accept'}
        </button>
      </div>
    </div>
  );
}
