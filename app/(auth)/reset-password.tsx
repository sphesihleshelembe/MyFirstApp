import { useEffect, useState } from 'react';
import { View, TextInput, Button, Alert, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true); // start locked until session check completes
  const [updating, setUpdating] = useState(false);

  // 1. VERIFY SESSION EXISTS (VERY IMPORTANT)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.log('Session error:', error.message);
          Alert.alert('Error', 'Session error. Please try again.');
          router.replace('/(auth)/login');
          return;
        }

        if (!data.session) {
          console.log('No session found');
          Alert.alert('Error', 'Reset session not found or expired.');
          router.replace('/(auth)/login');
          return;
        }

        console.log('Recovery session active');
        setLoading(false);
      } catch (err: any) {
        console.log('Unexpected error:', err.message);
        Alert.alert('Error', 'Something went wrong.');
        router.replace('/(auth)/login');
      }
    };

    checkSession();
  }, []);

  // 2. UPDATE PASSWORD
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

      // optional: sign out to fully clear recovery session
      await supabase.auth.signOut();

      router.replace('/(auth)/login');
    } catch (err: any) {
      console.log('Unexpected error:', err.message);
      Alert.alert('Error', err.message);
    } finally {
      setUpdating(false);
    }
  };

  // 3. LOADING STATE
  if (loading) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Checking reset session...</Text>
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
        title={updating ? "Updating..." : "Update Password"}
        onPress={updatePassword}
      />
    </View>
  );
}