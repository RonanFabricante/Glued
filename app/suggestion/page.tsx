import { getSuggestion } from '@/lib/data/suggestions';
import { getCurrentProfile } from '@/lib/data/connections';
import { redirect } from 'next/navigation';
import SuggestionCard from '@/components/SuggestionCard';

export default async function SuggestionPage() {
  const currentProfile = await getCurrentProfile();
  
  if (!currentProfile) {
    redirect('/onboarding');
  }

  const suggestion = await getSuggestion();

  if (!suggestion) {
    return (
      <div className="min-h-screen bg-calm-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          <div className="card text-center">
            <h2 className="text-2xl font-bold text-calm-900 mb-4">No suggestions available</h2>
            <p className="text-calm-700 mb-6">
              Check back later for new connection opportunities.
            </p>
            <a href="/dashboard" className="btn-primary inline-block">
              Back to dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Calculate overlaps
  const intentOverlap = currentProfile.intent_types.filter((intent) =>
    suggestion.intent_types.includes(intent)
  );

  const currentAvailability = (currentProfile.availability as any)?.slots || [];
  const suggestionAvailability = (suggestion.availability as any)?.slots || [];
  const availabilityOverlap = currentAvailability.filter((slot: string) =>
    suggestionAvailability.includes(slot)
  );

  return (
    <div className="min-h-screen bg-calm-50">
      <header className="bg-white border-b border-calm-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-calm-900">New suggestion</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <SuggestionCard
          suggestion={suggestion}
          intentOverlap={intentOverlap}
          availabilityOverlap={availabilityOverlap}
        />
      </main>
    </div>
  );
}
