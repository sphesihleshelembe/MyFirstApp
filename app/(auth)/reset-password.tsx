import { useEffect, useState } from 'react';
import { View, TextInput, Button, Alert, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 🔥 FIX: Force Supabase session hydration after verify redirect
  useEffect(() => {
    const initSession = async () => {
      try {
        // 1. Force refresh session (IMPORTANT for Expo Web + verify flow)
        const { error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.log('Refresh error:', refreshError.message);
        }

        // 2. Now check session
        const { data } = await supabase.auth.getSession();

        console.log('SESSION CHECK:', data.session);

        // 3. If no session → invalid or expired reset link
        if (!data.session) {
          Alert.alert(
            'Reset link invalid',
            'Your reset link is invalid or expired. Please request a new one.'
          );

          router.replace('/(auth)/login');
          return;
        }

        // 4. Session OK → allow password reset
        setLoading(false);
      } catch (err: any) {
        console.log('Init error:', err.message);

        Alert.alert('Error', 'Something went wrong. Please try again.');
        router.replace('/(auth)/login');
      }
    };

    initSession();
  }, []);

  // 🔥 UPDATE PASSWORD
  const updatePassword = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setUpdating(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.log('Update error:', error.message);
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert('Success', 'Password updated successfully');

      // clean logout after reset (important for recovery sessions)
      await supabase.auth.signOut();

      router.replace('/(auth)/login');
    } catch (err: any) {
      console.log('Unexpected error:', err.message);
      Alert.alert('Error', err.message);
    } finally {
      setUpdating(false);
    }
  };

  // 🔥 LOADING STATE
  if (loading) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Verifying reset link...</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Reset Password
      </Text>

      <Text style={{ marginBottom: 10, color: 'gray' }}>
        Enter your new password below
      </Text>

      <TextInput
        placeholder="New password"
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
        title={updating ? 'Updating...' : 'Update Password'}
        onPress={updatePassword}
      />
    </View>
  );
}