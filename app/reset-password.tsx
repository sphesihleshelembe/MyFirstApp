import { useEffect, useState } from 'react';
import { View, TextInput, Button, Alert, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log('Reset password screen loaded');

      // Check if Supabase already created a recovery session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        console.log('Recovery session exists');
        setSessionReady(true);
      }
    };

    init();

    // Listen for Supabase recovery event (THIS is the key)
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      console.log('Auth event:', event);

      if (event === 'PASSWORD_RECOVERY') {
        console.log('Recovery mode activated');
        setSessionReady(true);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
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
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Reset Password
      </Text>

      {!sessionReady ? (
        <Text style={{ color: 'gray' }}>
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