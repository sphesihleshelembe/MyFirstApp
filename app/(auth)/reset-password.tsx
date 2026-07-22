import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { colors, spacing, radius } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Lock, Eye, EyeOff } from 'lucide-react-native';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // The session arrives via PASSWORD_RECOVERY event triggered by the reset link.
    // We must wait for onAuthStateChange rather than checking getSession() synchronously.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setLoading(false);
      } else if (event === 'SIGNED_IN' && session) {
        // Supabase may fire SIGNED_IN instead of PASSWORD_RECOVERY in some flows
        setLoading(false);
      }
    });

    // Also check if a session already exists (callback redirected us with one active)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setLoading(false);
    });

    // Timeout: if no session after 8s, the link is invalid/expired
    const timeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          // Still loading — session never arrived
          router.replace('/(auth)/forgot-password');
        }
        return prev;
      });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleUpdate = async () => {
    setError(null);
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setUpdating(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setUpdating(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    await supabase.auth.signOut();
    setTimeout(() => router.replace('/(auth)/login'), 1500);
  };

  if (loading) {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Verifying reset link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="light" />
        <View style={styles.centered}>
          <View style={styles.successIcon}>
            <Lock color={colors.success} size={32} />
          </View>
          <Text style={styles.successTitle}>Password Updated</Text>
          <Text style={styles.successDesc}>Redirecting you to login...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
    <StatusBar
  style="light"
  translucent={false}
  backgroundColor="#0A0A0F"
/>
      <View style={styles.content}>
        <View style={styles.iconBg}>
          <Lock color={colors.primaryLight} size={28} />
        </View>
        <Text style={styles.title}>Set New Password</Text>
        <Text style={styles.subtitle}>Choose a strong password for your account</Text>

        <View style={styles.field}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
              {showPassword
                ? <EyeOff color={colors.textMuted} size={18} />
                : <Eye color={colors.textMuted} size={18} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Repeat your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showConfirm}
              value={confirm}
              onChangeText={setConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
              {showConfirm
                ? <EyeOff color={colors.textMuted} size={18} />
                : <Eye color={colors.textMuted} size={18} />}
            </TouchableOpacity>
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.btn} onPress={handleUpdate} disabled={updating}>
          {updating
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Text style={styles.btnText}>Update Password</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.backLink}>
          <Text style={styles.backLinkText}>Back to login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  loadingText: { fontSize: 15, color: colors.textSecondary, marginTop: spacing.sm },
  successIcon: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: colors.successGlow,
    justifyContent: 'center', alignItems: 'center',
  },
  successTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  successDesc: { fontSize: 14, color: colors.textSecondary },
  content: { flex: 1, padding: spacing.lg, paddingTop: spacing.xl, alignItems: 'center' },
  iconBg: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xl, textAlign: 'center' },
  field: { width: '100%', marginBottom: spacing.md },
  label: {
    fontSize: 12, fontWeight: '600', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing.md, height: 52,
  },
  input: { flex: 1, fontSize: 15, color: colors.text },
  eyeBtn: { padding: spacing.xs },
  error: { color: colors.error, fontSize: 13, marginBottom: spacing.md, textAlign: 'center' },
  btn: {
    width: '100%', height: 52, borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.white },
  backLink: { marginTop: spacing.lg },
  backLinkText: { fontSize: 14, color: colors.textMuted },
});

