import Link from 'next/link';
import { DashboardSlot as DashboardSlotType } from '@/lib/supabase/types';

interface DashboardSlotProps {
  slot: DashboardSlotType;
  atCapacity: boolean;
}

export default function DashboardSlot({ slot, atCapacity }: DashboardSlotProps) {
  if (slot.type === 'empty') {
    return (
      <div className="card bg-calm-50 border-2 border-dashed border-calm-300">
        <div className="text-center py-6">
          <div className="text-calm-600 mb-4">Open slot</div>
          {atCapacity ? (
            <button disabled className="btn-primary">
              Get a suggestion
            </button>
          ) : (
            <Link href="/suggestion" className="btn-primary inline-block">
              Get a suggestion
            </Link>
          )}
        </div>
      </div>
    );
  }

  const { connection, daysRemaining } = slot;
  if (!connection) return null;

  const intentDisplay = connection.other_user.intent_types.slice(0, 2).join(', ');

  return (
    <Link href={`/connections/${connection.id}`}>
      <div className="card hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-calm-900 mb-1">
              {connection.other_user.first_name}
            </h3>
            {connection.other_user.area && (
              <p className="text-sm text-calm-600 mb-2">{connection.other_user.area}</p>
            )}
            {intentDisplay && (
              <p className="text-sm text-calm-700 mb-3">{intentDisplay}</p>
            )}
            <div className="flex items-center gap-3 text-sm">
              <span className="chip">Active</span>
              <span className="text-calm-600">
                {daysRemaining === 0
                  ? 'Expires today'
                  : daysRemaining === 1
                  ? '1 day remaining'
                  : `${daysRemaining} days remaining`}
              </span>
            </div>
          </div>
          <div className="text-calm-400">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
