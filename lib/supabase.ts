import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lamgxfzibxpkxjhgxnwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhbWd4ZnppYnhwa3hqaGd4bndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODY0MDMsImV4cCI6MjA5NDI2MjQwM30.qWvXqvwBC5Ue35j194QNzQUzVNjJJ0yH-l0dj7nhwZk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
