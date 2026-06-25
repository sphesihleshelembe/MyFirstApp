import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  LogOut,
  Bell,
  Shield,
  HelpCircle,
  Info,
  ChevronRight,
  Moon,
  FileText,
  Trash2,
  Download,
  User,
  Palette,
  AlertTriangle,
  X,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing, radius } from '@/constants/theme';

type ConfirmMode = 'signout' | 'delete' | null;

export default function SettingsScreen() {
  const { user, signOut, deleteAccount } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    await signOut();
    setLoading(false);
    setConfirmMode(null);
    router.replace('/(auth)/login');
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setError(null);
    const { error: err } = await deleteAccount();
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setConfirmMode(null);
      router.replace('/(auth)/login');
    }
  };

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your account</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Account Card */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.accountCard}>
            <View style={styles.accountRow}>
              <View style={styles.accountAvatar}>
                <Text style={styles.accountAvatarText}>
                  {(user?.email?.[0] || 'U').toUpperCase()}
                </Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountEmail}>{user?.email}</Text>
                <View style={styles.accountBadge}>
                  <Text style={styles.accountBadgeText}>Free Plan</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.accountEditBtn}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <User color={colors.primaryLight} size={18} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferences</Text>
          <View style={styles.card}>
            <SettingToggle
              icon={<Bell color={colors.primaryLight} size={20} />}
              label="Push Notifications"
              desc="Get updates and reminders"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<Moon color={colors.accent} size={20} />}
              label="Theme"
              desc="Dark Mode"
              onPress={() => {}}
              disabled
            />
          </View>
        </View>

        {/* CV Options */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CV Options</Text>
          <View style={styles.card}>
            <SettingRow
              icon={<FileText color={colors.primaryLight} size={20} />}
              label="My CVs"
              desc={`${0} saved CVs`}
              onPress={() => router.push('/(tabs)/my-cvs')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<Download color={colors.success} size={20} />}
              label="Download Format"
              desc="HTML (browser printable)"
              onPress={() => showAlert('Download', 'Open any CV and use the Download button to save as PDF. Open the file in your browser and print to PDF.')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<Palette color={colors.warning} size={20} />}
              label="Templates"
              desc="8 templates available"
              onPress={() => router.push('/(tabs)/create')}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Support</Text>
          <View style={styles.card}>
            <SettingRow
              icon={<HelpCircle color={colors.primaryLight} size={20} />}
              label="Help Center"
              desc="Guides and FAQs"
              onPress={() => showAlert('Help', 'Email support at support sphesihleshelembe12@gmail.com')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<Shield color={colors.primaryLight} size={20} />}
              label="Privacy Policy"
              desc="How we handle your data"
              onPress={() => showAlert('Privacy', 'Your data is stored securely and never shared with third parties.')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<Info color={colors.primaryLight} size={20} />}
              label="About CVCraft AI"
              desc="Version 1.0.0"
              onPress={() => showAlert('CVCraft AI', 'Version 1.0.0\n\nAI-powered CV builder for professionals.\nBuilt by Sphesihle Shelembe.')}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Danger Zone</Text>
          <View style={styles.card}>
            {/* Sign Out */}
            <TouchableOpacity
              style={styles.dangerRow}
              onPress={() => { setConfirmMode('signout'); setError(null); }}
              activeOpacity={0.7}
            >
              <View style={[styles.rowIcon, styles.rowIconDanger]}>
                <LogOut color={colors.error} size={20} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, styles.rowLabelDanger]}>Sign Out</Text>
                <Text style={styles.rowDesc}>Sign out of your account</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={18} />
            </TouchableOpacity>

            {confirmMode === 'signout' && (
              <View style={styles.confirmBox}>
                <View style={styles.confirmHeader}>
                  <AlertTriangle color={colors.warning} size={18} />
                  <Text style={styles.confirmTitle}>Sign out?</Text>
                  <TouchableOpacity onPress={() => setConfirmMode(null)} style={styles.confirmClose}>
                    <X color={colors.textMuted} size={16} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.confirmDesc}>You will be redirected to the login screen.</Text>
                <View style={styles.confirmActions}>
                  <TouchableOpacity style={styles.confirmCancel} onPress={() => setConfirmMode(null)}>
                    <Text style={styles.confirmCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmDanger}
                    onPress={handleSignOut}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.confirmDangerText}>Sign Out</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.divider} />

            {/* Delete Account */}
            <TouchableOpacity
              style={styles.dangerRow}
              onPress={() => { setConfirmMode('delete'); setError(null); }}
              activeOpacity={0.7}
            >
              <View style={[styles.rowIcon, styles.rowIconDanger]}>
                <Trash2 color={colors.error} size={20} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, styles.rowLabelDanger]}>Delete Account</Text>
                <Text style={styles.rowDesc}>Permanently delete all data</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={18} />
            </TouchableOpacity>

            {confirmMode === 'delete' && (
              <View style={[styles.confirmBox, styles.confirmBoxDanger]}>
                <View style={styles.confirmHeader}>
                  <AlertTriangle color={colors.error} size={18} />
                  <Text style={[styles.confirmTitle, { color: colors.error }]}>Delete account?</Text>
                  <TouchableOpacity onPress={() => setConfirmMode(null)} style={styles.confirmClose}>
                    <X color={colors.textMuted} size={16} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.confirmDesc}>
                  This will permanently delete your account and all CVs. This cannot be undone.
                </Text>
                {error && <Text style={styles.confirmError}>{error}</Text>}
                <View style={styles.confirmActions}>
                  <TouchableOpacity style={styles.confirmCancel} onPress={() => setConfirmMode(null)}>
                    <Text style={styles.confirmCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmDanger}
                    onPress={handleDeleteAccount}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.confirmDangerText}>Delete Forever</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>CVCraft AI v1.0.0</Text>
          <Text style={styles.footerLink}>Made with care</Text>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ icon, label, desc, onPress, disabled }: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={disabled} activeOpacity={disabled ? 1 : 0.7}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      {!disabled && <ChevronRight color={colors.textMuted} size={18} />}
    </TouchableOpacity>
  );
}

function SettingToggle({ icon, label, desc, value, onValueChange }: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.borderLight, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: 0.3 },
  headerSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  scrollContent: { padding: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  accountCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  accountRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  accountAvatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  accountAvatarText: { fontSize: 22, fontWeight: '700', color: colors.white },
  accountInfo: { flex: 1 },
  accountEmail: { fontSize: 15, fontWeight: '600', color: colors.text },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successGlow,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  accountBadgeText: { fontSize: 11, fontWeight: '600', color: colors.success, textTransform: 'uppercase', letterSpacing: 0.5 },
  accountEditBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryGlow, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  dangerRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  rowIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primaryGlow, justifyContent: 'center', alignItems: 'center' },
  rowIconDanger: { backgroundColor: colors.errorGlow },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowLabelDanger: { color: colors.error },
  rowDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.md + 42 + spacing.md },

  // Inline confirm box
  confirmBox: {
    margin: spacing.md,
    marginTop: 0,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '44',
  },
  confirmBoxDanger: {
    borderColor: colors.error + '44',
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  confirmTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.warning,
  },
  confirmClose: {
    padding: 4,
  },
  confirmDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  confirmError: {
    fontSize: 12,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confirmCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmDanger: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  confirmDangerText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },

  footer: { alignItems: 'center', paddingTop: spacing.xl },
  footerText: { fontSize: 13, color: colors.textMuted },
  footerLink: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});
