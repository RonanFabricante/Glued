import { getDashboardSlots, hasExpiredConnections, getCurrentProfile } from '@/lib/data/connections';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import DashboardSlot from '@/components/DashboardSlot';
import ExpiredConnectionsNotice from '@/components/ExpiredConnectionsNotice';
import LogoutButton from '@/components/LogoutButton';
import DeleteProfileButton from '@/components/DeleteProfileButton';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if profile exists
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect('/onboarding');
  }

  const slots = await getDashboardSlots();
  const hasExpired = await hasExpiredConnections();
  const activeCount = slots.filter((s) => s.type === 'active').length;
  const atCapacity = activeCount >= 3;

  return (
    <div className="min-h-screen bg-calm-50">
      <header className="bg-white border-b border-calm-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-calm-900">Glued</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-calm-600">Hello, {profile.first_name}</div>
              <DeleteProfileButton />
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {hasExpired && <ExpiredConnectionsNotice />}

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-calm-900 mb-2">Your connections</h2>
          <p className="text-sm text-calm-600">
            {activeCount} of 3 slots active
          </p>
        </div>

        <div className="grid gap-4 mb-8">
          {slots.map((slot, index) => (
            <DashboardSlot key={index} slot={slot} atCapacity={atCapacity} />
          ))}
        </div>

        {atCapacity && (
          <div className="card bg-calm-50 border-2 border-calm-300">
            <h3 className="text-lg font-semibold text-calm-900 mb-2">You're at capacity</h3>
            <p className="text-calm-700">Resolve one connection to open a slot for someone new.</p>
          </div>
        )}
      </main>
    </div>
  );
}
