import { supabase } from './supabase';
import { User } from '@/types';

export const signUp = async (
  email: string, 
  password: string, 
  fullName: string, 
  phoneNumber?: string
) => {
  // Step 1: Sign up with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phoneNumber || '', // Use 'phone' instead of 'phone_number'
        role: 'customer'
      }
    }
  });
  
  if (error) throw error;
  
  // Step 2: Create profile in profiles table (trigger will also do this)
  if (data.user) {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          phone: phoneNumber || '',
          role: 'customer'
        });
      
      // Ignore duplicate errors (trigger might have already created it)
      if (profileError && !profileError.message.includes('duplicate')) {
        console.error('Profile creation error:', profileError);
      }
    } catch (err) {
      console.error('Error creating profile:', err);
      // Don't throw - signup was successful even if profile creation failed
    }
  }
  
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // Try to get profile from profiles table first
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profile) {
      return {
        id: user.id,
        email: user.email!,
        full_name: profile.full_name || user.user_metadata?.full_name || '',
        phone: profile.phone || user.user_metadata?.phone || '',
        role: profile.role || user.user_metadata?.role || 'customer',
        created_at: user.created_at
      };
    }
  } catch (err) {
    console.error('Error fetching profile:', err);
  }
  
  // Fallback to user metadata if profile doesn't exist
  return {
    id: user.id,
    email: user.email!,
    full_name: user.user_metadata?.full_name || '',
    phone: user.user_metadata?.phone || user.user_metadata?.phone_number || '',
    role: user.user_metadata?.role || 'customer',
    created_at: user.created_at
  };
};

// Helper function to update user profile
export const updateUserProfile = async (updates: {
  full_name?: string;
  phone?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  // Update auth.users metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: {
      full_name: updates.full_name,
      phone: updates.phone
    }
  });
  
  if (authError) throw authError;
  
  // Update profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: updates.full_name,
      phone: updates.phone
    })
    .eq('id', user.id);
  
  if (profileError) throw profileError;
  
  return { success: true };
};
