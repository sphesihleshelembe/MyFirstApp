import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { FileText, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Zap, Award } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing, radius, typography } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          {/* Gradient Header */}
          <LinearGradient colors={['#0F172A', '#0A0A0F']} style={styles.header}>
            <View style={styles.headerPattern}>
              <Animated.View entering={ZoomIn.delay(200).duration(800)} style={styles.decorativeCircle1} />
              <Animated.View entering={ZoomIn.delay(400).duration(800)} style={styles.decorativeCircle2} />
            </View>

            <Animated.View entering={ZoomIn.delay(300).springify().damping(12)} style={styles.logoContainer}>
              <LinearGradient colors={[colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logo}>
                <FileText color={colors.white} size={36} strokeWidth={2} />
              </LinearGradient>
            </Animated.View>

            <Animated.Text entering={FadeInDown.delay(400).duration(400)} style={styles.appName}>CVCraft AI</Animated.Text>
            <Animated.Text entering={FadeInDown.delay(500).duration(400)} style={styles.tagline}>Build your perfect CV with AI</Animated.Text>

            {/* Feature Pills */}
            <Animated.View entering={FadeInUp.delay(600).duration(400)} style={styles.featureRow}>
              <FeaturePill icon={<Zap color={colors.primaryLight} size={14} />} text="AI-Powered" />
              <FeaturePill icon={<Award color={colors.success} size={14} />} text="Pro Templates" />
              <FeaturePill icon={<Shield color={colors.accent} size={14} />} text="Secure" />
            </Animated.View>
          </LinearGradient>

          {/* Form Card */}
          <Animated.View entering={FadeInUp.delay(700).duration(500)} style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Welcome back</Text>
              <Text style={styles.formSubtitle}>Sign in to continue building your career</Text>
            </View>

            {error && (
              <Animated.View entering={ZoomIn.springify()} exiting={FadeIn.duration(200)} style={styles.errorBox}>
                <View style={styles.errorIcon} />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            <View style={styles.inputSection}>
              <Animated.View entering={FadeInDown.delay(800).duration(300)}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconWrap}><Mail color={colors.textMuted} size={18} /></View>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@company.com"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                      selectionColor={colors.primary}
                    />
                  </View>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(900).duration(300)}>
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Text style={styles.inputLabel}>Password</Text>
                   <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                   <Text style={styles.forgotLink}>Forgot password?</Text>
                   </TouchableOpacity>
                  </View>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconWrap}><Lock color={colors.textMuted} size={18} /></View>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      selectionColor={colors.primary}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      {showPassword ? <EyeOff color={colors.textMuted} size={18} /> : <Eye color={colors.textMuted} size={18} />}
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(1000).duration(300)}>
                <AnimatedSubmitButton loading={loading} onPress={handleLogin} />
              </Animated.View>
            </View>

            <Animated.View entering={FadeIn.delay(1100).duration(400)}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.signupRow}>
                <Text style={styles.signupText}>Don't have an account?</Text>
                <Link href="/(auth)/signup" asChild>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.signupLink}>Create Account</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function AnimatedSubmitButton({ loading, onPress }: { loading: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={onPress}
        onPressIn={() => !loading && (scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 15, stiffness: 400 }))}
        disabled={loading}
        activeOpacity={1}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submitGradient}
        >
          <Text style={styles.submitBtnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          {!loading && <ArrowRight color={colors.white} size={18} />}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function FeaturePill({ icon, text }: { icon: React.ReactNode; text: string }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={styles.featurePill}
        activeOpacity={0.8}
        onPressIn={() => (scale.value = withSpring(0.95))}
        onPressOut={() => (scale.value = withSpring(1))}
      >
        {icon}
        <Text style={styles.featurePillText}>{text}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 32,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  headerPattern: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  decorativeCircle1: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -60,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(14, 165, 233, 0.06)',
  },
  logoContainer: { marginBottom: spacing.lg },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
  },
  appName: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: spacing.xs, letterSpacing: 0.5 },
  tagline: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.lg },
  featureRow: { flexDirection: 'row', gap: spacing.sm },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featurePillText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.3 },
  formCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  formHeader: { marginBottom: spacing.xl },
  formTitle: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  formSubtitle: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorGlow,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error,
    borderLeftWidth: 4,
  },
  errorIcon: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.error, marginRight: spacing.sm },
  errorText: { flex: 1, fontSize: 13, color: colors.error, fontWeight: '500' },
  inputSection: { marginBottom: spacing.lg },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  inputLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  forgotLink: { fontSize: 12, fontWeight: '600', color: colors.primaryLight },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    height: 56,
    paddingHorizontal: spacing.md,
  },
  inputIconWrap: { width: 24, alignItems: 'center' },
  input: { flex: 1, height: '100%', fontSize: 15, color: colors.text, paddingHorizontal: spacing.sm },
  eyeBtn: { padding: spacing.xs },
  submitBtn: {
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: 56 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: colors.white, letterSpacing: 0.3 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, color: colors.textMuted, marginHorizontal: spacing.md, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  signupText: { fontSize: 14, color: colors.textSecondary },
  signupLink: { fontSize: 14, fontWeight: '700', color: colors.primaryLight },
});
