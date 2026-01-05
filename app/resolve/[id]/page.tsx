import { getConnection } from '@/lib/data/connections';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ResolveFlow from '@/components/ResolveFlow';

interface ResolvePageProps {
  params: Promise<{ id: string }>;
}

export default async function ResolvePage({ params }: ResolvePageProps) {
  const { id } = await params;
  const connection = await getConnection(id);

  if (!connection || connection.status !== 'active') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-calm-50">
      <header className="bg-white border-b border-calm-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href={`/connections/${id}`}
            className="text-calm-600 hover:text-calm-900 text-sm mb-2 inline-block"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-calm-900">Resolve connection</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <ResolveFlow connection={connection} />
      </main>
    </div>
  );
}
