import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { User, Mail, Edit3, Save, FileText, Calendar, Award, Sparkles, Check, X } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius, typography } from '@/constants/theme';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [cvCount, setCvCount] = useState(0);
  const [joinDate, setJoinDate] = useState('');

  useFocusEffect(
  useCallback(() => {
    if (user?.id) {
      loadProfile(user.id);
    }
  }, [user?.id])
);

  const loadProfile = async () => {
    if (!user) return;
    const [profileRes, cvsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('cvs').select('id', { count: 'exact' }).eq('user_id', user.id),
    ]);
    if (profileRes.data) setFullName(profileRes.data.full_name || '');
    if (cvsRes.count !== null) setCvCount(cvsRes.count);
    setJoinDate(new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      Alert.alert('Error', 'Failed to update profile');
    } else {
      setEditing(false);
    }
  };

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || 'U').toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <LinearGradient colors={['#0F172A', '#0A0A0F']} style={styles.header}>
          <View style={styles.headerPattern}>
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
          </View>

          {editing ? (
            <View style={styles.editAvatarSection}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
              <View style={styles.editNameContainer}>
                <TextInput
                  style={styles.editNameInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Your full name"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                />
                <Text style={styles.editEmail}>{user?.email}</Text>
              </View>
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.editActionBtn}
                  onPress={() => { setEditing(false); loadProfile(); }}
                >
                  <X color={colors.textSecondary} size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editActionBtn, styles.editActionSave]}
                  onPress={saveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Check color={colors.white} size={18} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.avatarSection}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
              <Text style={styles.name}>{fullName || 'Set your name'}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setEditing(true)}
              >
                <Edit3 color={colors.primaryLight} size={16} />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <StatCard
              icon={<FileText color={colors.primaryLight} size={22} />}
              value={String(cvCount)}
              label="CVs Created"
              color={colors.primary}
            />
            <View style={styles.statDivider} />
            <StatCard
              icon={<Calendar color={colors.success} size={22} />}
              value={joinDate.split(' ')[0]}
              label="Member Since"
              color={colors.success}
            />
            <View style={styles.statDivider} />
            <StatCard
              icon={<Award color={colors.warning} size={22} />}
              value="Pro"
              label="Account Type"
              color={colors.warning}
            />
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.detailsCard}>
            <DetailRow
              icon={<User color={colors.primaryLight} size={20} />}
              label="Full Name"
              value={fullName || 'Not set'}
              highlight={!!fullName}
            />
            <View style={styles.detailDivider} />
            <DetailRow
              icon={<Mail color={colors.primaryLight} size={20} />}
              label="Email Address"
              value={user?.email || ''}
              highlight={true}
            />
            <View style={styles.detailDivider} />
            <DetailRow
              icon={<Calendar color={colors.primaryLight} size={20} />}
              label="Member Since"
              value={joinDate}
              highlight={false}
            />
          </View>
        </View>

        {/* Activity Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIconBg, { backgroundColor: colors.primaryGlow }]}>
                <FileText color={colors.primaryLight} size={18} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityLabel}>Total CVs</Text>
                <Text style={styles.activityValue}>{cvCount} professional CV{cvCount !== 1 ? 's' : ''}</Text>
              </View>
            </View>
            <View style={styles.activityDivider} />
            <View style={styles.activityItem}>
              <View style={[styles.activityIconBg, { backgroundColor: colors.accentGlow }]}>
                <Sparkles color={colors.accent} size={18} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityLabel}>AI Summaries</Text>
                <Text style={styles.activityValue}>Generated with AI</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBg, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight: boolean }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconBg}>{icon}</View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, highlight && styles.detailValueHighlight]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  headerPattern: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  decorativeCircle1: {
    position: 'absolute',
    top: -80,
    right: -100,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -60,
    left: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(14, 165, 233, 0.06)',
  },
  avatarSection: { alignItems: 'center', paddingTop: spacing.md },
  editAvatarSection: { alignItems: 'center', paddingTop: spacing.md, width: '100%', paddingHorizontal: spacing.lg },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  avatarText: { fontSize: 40, fontWeight: '700', color: colors.white },
  name: { fontSize: 28, fontWeight: '700', color: colors.text, marginTop: spacing.md, letterSpacing: 0.3 },
  email: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editBtnText: { fontSize: 14, fontWeight: '600', color: colors.primaryLight },
  editNameContainer: { marginTop: spacing.lg, width: '100%' },
  editNameInput: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  editEmail: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  editActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  editActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  editActionSave: { backgroundColor: colors.primary, borderColor: colors.primary },
  statsSection: { padding: spacing.lg },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statIconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  section: { padding: spacing.lg },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: spacing.md, letterSpacing: 0.2 },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  detailIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  detailValue: { fontSize: 15, color: colors.text },
  detailValueHighlight: { fontWeight: '600' },
  detailDivider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.md + 42 + spacing.md },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  activityItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  activityIconBg: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  activityContent: { flex: 1 },
  activityLabel: { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  activityValue: { fontSize: 15, color: colors.text, fontWeight: '600', marginTop: 2 },
  activityDivider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.md + 42 + spacing.md },
});
