import { createClient } from '@/lib/supabase/server';
import { Connection, ConnectionWithProfile, DashboardSlot, Profile } from '@/lib/supabase/types';

export async function getActiveConnections(): Promise<ConnectionWithProfile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: connections, error } = await supabase
    .from('connections')
    .select('*')
    .eq('status', 'active')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error || !connections) return [];

  // Fetch profiles for other users
  const connectionsWithProfiles = await Promise.all(
    connections.map(async (conn) => {
      const otherUserId = conn.user_a === user.id ? conn.user_b : conn.user_a;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .single();

      return {
        ...conn,
        other_user: profile as Profile,
      };
    })
  );

  return connectionsWithProfiles;
}

export async function getDashboardSlots(): Promise<DashboardSlot[]> {
  const activeConnections = await getActiveConnections();

  const slots: DashboardSlot[] = activeConnections.map((conn) => ({
    type: 'active' as const,
    connection: conn,
    daysRemaining: calculateDaysRemaining(conn.expires_at),
  }));

  // Fill remaining slots with empty slots
  const emptySlotCount = 3 - slots.length;
  for (let i = 0; i < emptySlotCount; i++) {
    slots.push({ type: 'empty' as const });
  }

  return slots;
}

export function calculateDaysRemaining(expiresAt: string): number {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export async function getConnection(connectionId: string): Promise<ConnectionWithProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: connection, error } = await supabase
    .from('connections')
    .select('*')
    .eq('id', connectionId)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .single();

  if (error || !connection) return null;

  const otherUserId = connection.user_a === user.id ? connection.user_b : connection.user_a;
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', otherUserId)
    .single();

  return {
    ...connection,
    other_user: profile as Profile,
  };
}

export async function hasExpiredConnections(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from('connections')
    .select('id')
    .eq('status', 'active')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .lt('expires_at', new Date().toISOString())
    .limit(1);

  return !error && data && data.length > 0;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile as Profile | null;
}
