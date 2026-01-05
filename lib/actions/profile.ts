'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface CreateProfileData {
  firstName: string;
  area: string;
  intentTypes: string[];
  availability: string[];
}

export async function createProfile(data: CreateProfileData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    first_name: data.firstName,
    area: data.area,
    intent_types: data.intentTypes,
    availability: { slots: data.availability },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function updateProfile(data: Partial<CreateProfileData>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const updateData: any = {};
  if (data.firstName) updateData.first_name = data.firstName;
  if (data.area !== undefined) updateData.area = data.area;
  if (data.intentTypes) updateData.intent_types = data.intentTypes;
  if (data.availability) updateData.availability = { slots: data.availability };
  updateData.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Delete the profile first
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  // Sign out the user
  await supabase.auth.signOut();

  revalidatePath('/');
  redirect('/login');
}