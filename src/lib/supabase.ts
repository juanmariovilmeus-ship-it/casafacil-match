import { createClient } from '@supabase/supabase-js';

// Credenciais hardcodadas para funcionar no Netlify (sem variáveis de ambiente)
const supabaseUrl = 'https://lamgxfzibxpkxjhgxnwd.supabase.co';
const supabaseAnonKey = 'sb_publishable_0LztRSAEa4nHBAOUELzCxg_F0dX65-r';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
