console.log("reset-password route active");
import { useEffect, useState } from 'react';
import { View, TextInput, Button, Alert, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

export const unstable_settings = {
  initialRouteName: undefined,
};

console.log("reset-password route active");

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // 1. HANDLE DEEP LINK + SET SESSION
 useEffect(() => {
  const handleUrl = async (url: string) => {
    try {
      console.log('Incoming URL:', url);

      // CASE 1: PKCE FLOW (?code=)
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.log('Session error:', error.message);
          Alert.alert('Session Error', error.message);
          return;
        }

        setSessionReady(true);
        return;
      }

      // CASE 2: HASH FLOW (#access_token)
      const hash = url.split('#')[1];

      if (hash) {
        const params = new URLSearchParams(hash);

        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) {
            Alert.alert('Session Error', error.message);
            return;
          }

          setSessionReady(true);
        }
      }
    } catch (err: any) {
      console.log('Unexpected error:', err);
      Alert.alert('Error', err.message);
    }
  };

  // IMPORTANT: handle BOTH cases properly
  const handleDeepLink = (event: { url: string }) => {
    handleUrl(event.url);
  };

  Linking.getInitialURL().then((url) => {
    if (url) handleUrl(url);
  });

  const subscription = Linking.addEventListener('url', handleDeepLink);

  return () => {
    subscription.remove();
  };
}, []);
    // initial open
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => subscription.remove();
  }, []);

  // 2. UPDATE PASSWORD
  const updatePassword = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    Alert.alert('Success', 'Password updated successfully');

    router.replace('/(auth)/login');
  };

  // 3. UI
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Reset Password
      </Text>

      {!sessionReady ? (
        <Text style={{ marginBottom: 10, color: 'gray' }}>
          Waiting for reset link...
        </Text>
      ) : (
        <>
          <TextInput
            placeholder="Enter new password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{
              borderWidth: 1,
              padding: 10,
              marginBottom: 10,
              borderRadius: 5,
            }}
          />

          <Button
            title={loading ? 'Updating...' : 'Update Password'}
            onPress={updatePassword}
          />
        </>
      )}
    </View>
  );
}