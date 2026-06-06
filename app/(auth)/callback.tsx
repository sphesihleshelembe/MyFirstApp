import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';

export default function AuthCallback() {
  useEffect(() => {
    // Listen for PASSWORD_RECOVERY which Supabase fires when a reset link is followed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' ) {
        subscription.unsubscribe();
        router.replace('/(auth)/callback');
      }
    });

    // Fallback: session may already be present if the hash was processed before this mounts
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        router.replace('/(auth)/reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Verifying reset link...</Text>
    </View>
  );
}
