import { getConnection } from '@/lib/data/connections';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { calculateDaysRemaining } from '@/lib/data/connections';
import ChatInterface from '@/components/ChatInterface';
import { createClient } from '@/lib/supabase/server';

interface ConnectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConnectionPage({ params }: ConnectionPageProps) {
  const { id } = await params;
  const connection = await getConnection(id);

  if (!connection) {
    redirect('/dashboard');
  }

  // Get current user ID for chat
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const daysRemaining = calculateDaysRemaining(connection.expires_at);
  const isActive = connection.status === 'active';
  const isExpired = isActive && daysRemaining <= 0;

  const statusLabels = {
    active: 'Active',
    met: 'We met',
    closed: 'Mutually closed',
    timed_out: 'Timed out',
  };

  return (
    <div className="min-h-screen bg-calm-50">
      <header className="bg-white border-b border-calm-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/dashboard" className="text-calm-600 hover:text-calm-900 text-sm mb-2 inline-block">
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold text-calm-900">Connection details</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-calm-900 mb-2">
                {connection.other_user.first_name}
              </h2>
              {connection.other_user.area && (
                <p className="text-lg text-calm-600">{connection.other_user.area}</p>
              )}
            </div>
            <span
              className={`chip ${
                isActive ? 'bg-green-100 text-green-800 border-green-300' : ''
              }`}
            >
              {statusLabels[connection.status]}
            </span>
          </div>

          {connection.other_user.intent_types.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-calm-700 mb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {connection.other_user.intent_types.map((intent) => (
                  <span key={intent} className="chip">
                    {intent}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isActive && (
            <div className="bg-calm-50 border border-calm-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-calm-700 mb-1">Time remaining</h3>
              <p className="text-calm-900">
                {isExpired
                  ? 'This connection has expired'
                  : daysRemaining === 1
                  ? '1 day remaining'
                  : `${daysRemaining} days remaining`}
              </p>
              {isExpired && (
                <p className="text-sm text-calm-600 mt-1">
                  Resolve this connection to free up a slot.
                </p>
              )}
            </div>
          )}

          {connection.resolved_at && (
            <div className="bg-calm-50 border border-calm-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-calm-700 mb-1">Resolved</h3>
              <p className="text-calm-900">
                {new Date(connection.resolved_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>

        {isActive && (
          <>
            <Link href={`/resolve/${connection.id}`} className="btn-primary w-full mb-4 block text-center">
              Resolve connection
            </Link>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-calm-900 mb-4">Messages</h3>
              <ChatInterface connectionId={connection.id} currentUserId={user.id} />
            </div>
          </>
        )}

        {!isActive && (
          <Link href="/dashboard" className="btn-secondary w-full block text-center">
            Back to dashboard
          </Link>
        )}
      </main>
    </div>
  );
}
