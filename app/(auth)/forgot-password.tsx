import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');

const handleReset = async () => {
  try {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo: 'https://ai-cv-builder-app-cl4a.bolt.host/auth/callback',
    });

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

   Alert.alert(
  'Check Your Email',
  'If an account exists for this email address, a password reset link has been sent. Please check your inbox and spam folder.'
);
  } catch (err: any) {
    Alert.alert('Error', err.message);
  }
};

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>
        Reset Password
      </Text>

      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 20,
          borderRadius: 8,
        }}
      />

      <TouchableOpacity
        onPress={handleReset}
        style={{
          backgroundColor: '#2563eb',
          padding: 12,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Send Reset Link
        </Text>
      </TouchableOpacity>
    </View>
  );
}