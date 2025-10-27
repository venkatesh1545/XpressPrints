import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aexllphtbsarrupxhjhg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleGxscGh0YnNhcnJ1cHhoamhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MDY4MjIsImV4cCI6MjA3Njk4MjgyMn0.DHHg5zurKmiyNBdchHTDTCylPdsG2eSN9McB3aST6vs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);