'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type OnboardingStep = 'contract' | 'details';

const INTENT_OPTIONS = [
  'Coffee meetup',
  'Professional networking',
  'Creative collaboration',
  'Learning partner',
  'Activity buddy',
  'Just conversation',
];

const AVAILABILITY_OPTIONS = ['Weekday mornings', 'Weekday evenings', 'Weekends', 'Flexible'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('contract');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [area, setArea] = useState('');
  const [intentTypes, setIntentTypes] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);

  const supabase = createClient();

  const handleContractAccept = () => {
    setStep('details');
  };

  const handleContractReject = () => {
    router.push('/login');
  };

  const toggleIntent = (intent: string) => {
    setIntentTypes((prev) =>
      prev.includes(intent) ? prev.filter((i) => i !== intent) : [...prev, intent]
    );
  };

  const toggleAvailability = (slot: string) => {
    setAvailability((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        first_name: firstName,
        area,
        intent_types: intentTypes,
        availability: { slots: availability },
      });

      if (insertError) {
        throw insertError;
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  if (step === 'contract') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          <div className="card">
            <h1 className="text-3xl font-bold text-calm-900 mb-6">Three connections, max</h1>

            <div className="space-y-4 mb-8">
              <p className="text-calm-700 leading-relaxed">
                You can have up to 3 active connections at a time. To start a new one, you'll need to
                resolve an existing connection.
              </p>

              <div className="bg-calm-50 border border-calm-200 rounded-lg p-4">
                <p className="text-sm text-calm-600 font-medium mb-2">Resolving can mean:</p>
                <ul className="space-y-1 text-sm text-calm-600">
                  <li>• You met</li>
                  <li>• You mutually close</li>
                  <li>• It times out</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button onClick={handleContractReject} className="btn-secondary flex-1">
                Not for me
              </button>
              <button onClick={handleContractAccept} className="btn-primary flex-1">
                I understand
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="card">
          <h1 className="text-3xl font-bold text-calm-900 mb-2">Welcome to Glued</h1>
          <p className="text-calm-600 mb-8">Let's set up your profile</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-calm-700 mb-2">
                First name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alex"
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="area" className="block text-sm font-medium text-calm-700 mb-2">
                Area / City
              </label>
              <input
                id="area"
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="San Francisco"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-calm-700 mb-3">
                What are you interested in? (select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {INTENT_OPTIONS.map((intent) => (
                  <button
                    key={intent}
                    type="button"
                    onClick={() => toggleIntent(intent)}
                    className={`chip ${intentTypes.includes(intent) ? 'chip-selected' : ''}`}
                  >
                    {intent}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-calm-700 mb-3">
                When are you typically available?
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABILITY_OPTIONS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleAvailability(slot)}
                    className={`chip ${availability.includes(slot) ? 'chip-selected' : ''}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating profile...' : 'Continue to dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
