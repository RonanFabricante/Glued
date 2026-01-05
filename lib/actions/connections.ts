'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function acceptSuggestion(suggestionUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  const { error } = await supabase.from('connections').insert({
    user_a: user.id,
    user_b: suggestionUserId,
    status: 'active',
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    if (error.message.includes('3 active connections')) {
      return { error: "You're at capacity. Resolve one connection to open a slot." };
    }
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function resolveConnection(
  connectionId: string,
  status: 'met' | 'closed' | 'timed_out'
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('connections')
    .update({
      status,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', connectionId)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath(`/connections/${connectionId}`);
  redirect('/dashboard');
}

export async function autoResolveExpired() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: expiredConnections } = await supabase
    .from('connections')
    .select('id')
    .eq('status', 'active')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .lt('expires_at', new Date().toISOString());

  if (expiredConnections && expiredConnections.length > 0) {
    const updates = expiredConnections.map((conn) =>
      supabase
        .from('connections')
        .update({
          status: 'timed_out',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', conn.id)
    );

    await Promise.all(updates);
  }

  revalidatePath('/dashboard');
  return { success: true };
}
