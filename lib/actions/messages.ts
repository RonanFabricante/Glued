'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function sendMessage(connectionId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Validate content
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return { error: 'Message cannot be empty' };
  }

  // Verify connection exists and is active
  const { data: connection, error: connectionError } = await supabase
    .from('connections')
    .select('*')
    .eq('id', connectionId)
    .eq('status', 'active')
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .single();

  if (connectionError || !connection) {
    return { error: 'Connection not found or not active' };
  }

  // Insert message
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      connection_id: connectionId,
      sender_id: user.id,
      content: trimmedContent,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/connections/${connectionId}`);
  return { data: message };
}

export async function getMessages(connectionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Verify connection exists
  const { data: connection, error: connectionError } = await supabase
    .from('connections')
    .select('*')
    .eq('id', connectionId)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .single();

  if (connectionError || !connection) {
    return { error: 'Connection not found' };
  }

  // Get messages
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('connection_id', connectionId)
    .order('created_at', { ascending: true });

  if (error) {
    return { error: error.message };
  }

  // Get sender profiles for each message
  const messagesWithSenders = await Promise.all(
    (messages || []).map(async (message) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', message.sender_id)
        .single();

      return {
        ...message,
        sender: profile,
      };
    })
  );

  return { data: messagesWithSenders };
}

export async function markAsRead(connectionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Verify connection exists
  const { data: connection, error: connectionError } = await supabase
    .from('connections')
    .select('*')
    .eq('id', connectionId)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .single();

  if (connectionError || !connection) {
    return { error: 'Connection not found' };
  }

  // Mark all unread messages as read
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('connection_id', connectionId)
    .neq('sender_id', user.id)
    .is('read_at', null);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/connections/${connectionId}`);
  return { success: true };
}
