/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import AuthScreen from './components/AuthScreen';
import HomeScreen from './components/HomeScreen';
import WelcomeScreen from './components/WelcomeScreen';
import { Toaster } from 'sonner';
import { Session } from '@supabase/supabase-js';
import { cleanupLocalStorageData } from '@/src/lib/imageCompressor';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'cliente' | 'proprietario' | null>(null);

  useEffect(() => {
    // Run periodic storage health review and purge expired / unavailable listings
    cleanupLocalStorageData(false);

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {session ? (
        <HomeScreen />
      ) : selectedRole ? (
        <AuthScreen selectedRole={selectedRole} onBack={() => setSelectedRole(null)} />
      ) : (
        <WelcomeScreen onSelectRole={(role) => setSelectedRole(role)} />
      )}
      <Toaster position="top-right" richColors theme="dark" />
    </>
  );
}

