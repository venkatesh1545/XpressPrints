import { supabase } from './supabase';
import { User } from '@/types';

export const signUp = async (email: string, password: string, fullName: string, phoneNumber?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone_number: phoneNumber,
        role: 'customer'
      }
    }
  });
  
  if (error) throw error;
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
  
  return {
    id: user.id,
    email: user.email!,
    full_name: user.user_metadata?.full_name || '',
    phone_number: user.user_metadata?.phone_number,
    role: user.user_metadata?.role || 'customer',
    created_at: user.created_at
  };
};