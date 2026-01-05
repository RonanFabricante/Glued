'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ConnectionWithProfile, ConnectionStatus } from '@/lib/supabase/types';

interface ResolveFlowProps {
  connection: ConnectionWithProfile;
}

type OutcomeType = 'met' | 'closed' | 'timed_out';

const OUTCOMES = [
  {
    value: 'met' as OutcomeType,
    label: 'We met',
    helper: 'In person or a real call counts.',
  },
  {
    value: 'closed' as OutcomeType,
    label: 'Mutually close',
    helper: 'No hard feelings. Clear is kind.',
  },
  {
    value: 'timed_out' as OutcomeType,
    label: 'Time out',
    helper: "We didn't get to it. That's okay.",
  },
];

const CLOSURE_TEMPLATES = [
  "Thanks for connecting. I don't think it's the right fit, but I appreciated the chat.",
  "You seem great — I'm not in the right headspace to continue. Wishing you well.",
  "I'm going to close this one so we can both move on. Take care.",
];

export default function ResolveFlow({ connection }: ResolveFlowProps) {
  const [step, setStep] = useState<'outcome' | 'note'>('outcome');
  const [outcome, setOutcome] = useState<OutcomeType | null>(null);
  const [selectedNote, setSelectedNote] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleOutcomeSelect = (value: OutcomeType) => {
    setOutcome(value);
    // For 'met', skip to confirmation
    if (value === 'met') {
      handleConfirm(value, null);
    } else {
      setStep('note');
    }
  };

  const handleConfirm = async (finalOutcome?: OutcomeType, noteIndex?: number | null) => {
    setLoading(true);
    setError('');

    const statusToUpdate = finalOutcome || outcome;
    if (!statusToUpdate) return;

    try {
      const { error: updateError } = await supabase
        .from('connections')
        .update({
          status: statusToUpdate as ConnectionStatus,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', connection.id);

      if (updateError) {
        throw updateError;
      }

      // In a real app, you'd send the closing note here
      // For MVP, we just acknowledge it was selected

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  if (step === 'outcome') {
    return (
      <div className="card">
        <h2 className="text-2xl font-bold text-calm-900 mb-2">
          Resolving connection with {connection.other_user.first_name}
        </h2>
        <p className="text-calm-600 mb-8">Choose what happened</p>

        <div className="space-y-3">
          {OUTCOMES.map((item) => (
            <button
              key={item.value}
              onClick={() => handleOutcomeSelect(item.value)}
              disabled={loading}
              className="w-full text-left p-4 rounded-lg border-2 border-calm-300 hover:border-calm-600 transition-colors disabled:opacity-50"
            >
              <div className="font-semibold text-calm-900 mb-1">{item.label}</div>
              <div className="text-sm text-calm-600">{item.helper}</div>
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-6 text-sm text-red-700 bg-red-50 p-3 rounded-lg">{error}</div>
        )}
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-calm-900 mb-2">Send a closing note?</h2>
      <p className="text-calm-600 mb-6">Optional, but kind</p>

      <div className="space-y-3 mb-6">
        {CLOSURE_TEMPLATES.map((template, index) => (
          <button
            key={index}
            onClick={() => setSelectedNote(index)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
              selectedNote === index
                ? 'border-calm-900 bg-calm-50'
                : 'border-calm-300 hover:border-calm-600'
            }`}
          >
            <p className="text-sm text-calm-700">{template}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <button
          onClick={() => handleConfirm(outcome!, null)}
          disabled={loading}
          className="btn-secondary flex-1"
        >
          Skip note
        </button>
        <button
          onClick={() => handleConfirm(outcome!, selectedNote)}
          disabled={loading}
          className="btn-primary flex-1"
        >
          {loading ? 'Resolving...' : 'Confirm & resolve'}
        </button>
      </div>

      {error && <div className="mt-4 text-sm text-red-700 bg-red-50 p-3 rounded-lg">{error}</div>}
    </div>
  );
}
