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

await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: "https://ai-cv-builder-app-cl4a.bolt.host/reset-password"
});
      
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert('Success', 'Password reset link sent to your email');
    } catch (err) {
      console.log(err);
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