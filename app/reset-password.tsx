console.log("reset-password route active");
import { useEffect, useState } from 'react';
import { View, TextInput, Button, Alert, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

console.log('reset-password route active');

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const handleUrl = async (url: string) => {
      try {
        console.log('Incoming URL:', url);

        // Handle PKCE flow (?code=...)
        const getQueryParam = (url: string, key: string) => {
          const match = url.match(new RegExp(`[?&]${key}=([^&]+)`));
          return match ? decodeURIComponent(match[1]) : null;
        };

        const code = getQueryParam(url, 'code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            Alert.alert('Session Error', error.message);
            return;
          }

          setSessionReady(true);
          return;
        }

        // Handle hash flow (#access_token=...&refresh_token=...)
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
            return;
          }
        }

        console.log('No valid reset parameters found');
      } catch (err: any) {
        console.log('Unexpected error:', err);
        Alert.alert('Error', err.message || 'Something went wrong');
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      }
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => subscription.remove();
  }, []);

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

  return (
    <View style={{ padding: 20 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: 10,
        }}
      >
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