import { useEffect, useState } from 'react'; 
import { View, TextInput, Button, Alert, Text } from 'react-native'; 
import { supabase } from '@/lib/supabase'; import { router } from 'expo-router'; import * as Linking from 'expo-linking'

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