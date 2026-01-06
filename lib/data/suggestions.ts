import { createClient } from '@/lib/supabase/server';
import { Profile } from '@/lib/supabase/types';

export async function getSuggestion(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get current user's profile
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!currentProfile) return null;

  // Get users the current user is NOT already connected with (only ACTIVE connections)
  const { data: existingConnections, error: connectionsError } = await supabase
    .from('connections')
    .select('user_a, user_b')
    .eq('status', 'active')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  // If there's an error, log it but continue (might be no connections yet)
  if (connectionsError && connectionsError.code !== 'PGRST116') {
    console.error('Error fetching connections:', connectionsError);
  }

  const connectedUserIds = new Set<string>();
  if (existingConnections) {
    existingConnections.forEach((conn) => {
      if (conn.user_a === user.id) connectedUserIds.add(conn.user_b);
      if (conn.user_b === user.id) connectedUserIds.add(conn.user_a);
    });
  }

  // Get all profiles except current user and already connected users
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', user.id);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return null;
  }

  if (!profiles || profiles.length === 0) return null;

  // Filter out already connected users
  const availableProfiles = profiles.filter((p) => !connectedUserIds.has(p.id));

  if (availableProfiles.length === 0) return null;

  // Simple suggestion: return a random available profile
  // In a real app, you'd implement more sophisticated matching logic
  const randomIndex = Math.floor(Math.random() * availableProfiles.length);
  return availableProfiles[randomIndex] as Profile;
}
