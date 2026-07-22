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
      redirectTo: 'https://ai-cv-builder-app-cl4a.bolt.host/(auth)/reset-password',
    });

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

   Alert.alert(
  'Check Your Email',
  'If an account exists for this email address, a password reset link has been sent. Please check your inbox.'
);
  } catch (err: any) {
    Alert.alert('Error', err.message);
  }
};

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>
        Reset Password :
      </Text>

      <TextInput
        placeholder="Enter your email"
        placeholderTextColor="#666666"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          padding: 12,
          marginBottom: 20,
          borderRadius: 8,
        }}
      />

      <TouchableOpacity
        onPress={handleReset}
        style={{
          backgroundColor: '#0A0A0F',
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