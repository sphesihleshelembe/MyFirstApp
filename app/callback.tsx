import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function AuthCallback() {
  useEffect(() => {
    const handle = async () => {
      console.log("Auth callback triggered");

      const { data: { session } } = await supabase.auth.getSession();

      console.log("SESSION:", session);

      if (session) {
        router.replace('/reset-password');
      } else {
        router.replace('/(auth)/login');
      }
    };

    handle();
  }, []);

  return (
    <View>
      <Text>Loading authentication...</Text>
    </View>
  );
}