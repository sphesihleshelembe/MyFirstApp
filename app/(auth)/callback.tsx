import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get query params (NOT hash)
        const url = window.location.href;
        const params = new URLSearchParams(window.location.search);

        const token_hash = params.get('token_hash');
        const type = params.get('type');

        console.log('Callback params:', { token_hash, type });

        // Safety check
        if (!token_hash || type !== 'recovery') {
          console.log('Invalid recovery link');
          router.replace('/(auth)/login');
          return;
        }

        // 🔥 STEP 1: Exchange token for session
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'recovery',
        });

        if (error) {
          console.log('verifyOtp error:', error.message);
          router.replace('/(auth)/login');
          return;
        }

        // 🔥 STEP 2: Confirm session exists
        const { data } = await supabase.auth.getSession();

        console.log('Session after verifyOtp:', data.session);

        if (!data.session) {
          console.log('No session created');
          router.replace('/(auth)/login');
          return;
        }

        // 🔥 STEP 3: Go to reset password screen
        router.replace('/reset-password');

      } catch (err: any) {
        console.log('Callback crash:', err.message);
        router.replace('/(auth)/login');
      }
    };

    handleAuth();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text>Verifying reset link...</Text>
    </View>
  );
}