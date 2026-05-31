import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  FileText,
  Plus,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
  Layers,
  Zap,
  Target,
  Award,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { supabase, CV } from '@/lib/supabase';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { downloadCVAsPDF } from '@/utils/cvExport';
import { Alert } from 'react-native';
import { CV_TEMPLATES } from '@/lib/templates';

const { width } = Dimensions.get('window');

const TEMPLATE_COLORS: Record<string, [string, string]> = {
  classic: [colors.primary, colors.primaryLight],
  modern: ['#0891B2', '#06B6D4'],
  minimal: ['#374151', '#6B7280'],
  executive: ['#1E3A5F', '#2563EB'],
};

const TEMPLATE_NAMES: Record<string, string> = {
  classic: 'Classic',
  modern: 'Modern',
  minimal: 'Minimal',
  executive: 'Executive',
};

const QUICK_ACTIONS = [
  { icon: <Sparkles color={colors.white} size={20} />, label: 'AI Summary', color: colors.primary, action: 'create' },
  { icon: <Layers color={colors.white} size={20} />, label: 'Templates', color: colors.accent, action: 'create' },
  { icon: <FileText color={colors.white} size={20} />, label: 'My CVs', color: colors.success, action: 'my-cvs' },
];

// Animated button component
function AnimatedButton({ onPress, children, style }: { onPress: () => void; children: React.ReactNode; style?: any }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  downloadCVAsPDF(cv, template)

  const template = CV_TEMPLATES.find(t => t.id === cv.template_id) || CV_TEMPLATES[0];
  
   const handleDownload = async (cv: CV) => {
    try {
      const template =
      CV_TEMPLATES.find(t => t.id === cv.template_id) ||
      CV_TEMPLATES[0];
      
     await downloadCVAsPDF(cv, template);
    } catch (error) {
      console.error('PDF Error:', error);
      Alert.alert('PDF Error', String(error));
    }
  };

 const fetchData = async () => {
  try {
    if (!user) return;

    setLoading(true);

    const [cvRes, profileRes] = await Promise.all([
      supabase
        .from('cvs')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false }),

      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    if (cvRes?.data) setCvs(cvRes.data as CV[]);
    if (profileRes?.data) setProfile(profileRes.data);

  } catch (error) {
    console.log("FETCH ERROR:", error);
  } finally {
    setLoading(false);
  }
};

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const recentCVs = cvs.slice(0, 4);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header Section */}
        <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.header}>
          <View style={styles.headerTop}>
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Text style={styles.greetingLabel}>{getGreeting()}</Text>
              <Text style={styles.greetingName}>{firstName}</Text>
            </Animated.View>
            <Animated.View entering={ZoomIn.delay(300).springify()}>
              <TouchableOpacity
                style={styles.avatarBtn}
                onPress={() => router.push('/(tabs)/profile')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {firstName.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
                <View style={styles.avatarBadge} />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Stats Cards */}
          <Animated.View entering={FadeInUp.delay(400).duration(400)}>
            <View style={styles.statsContainer}>
              <LinearGradient
                colors={TEMPLATE_COLORS.classic}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statsCard}
              >
                <View style={styles.statsIconBg}>
                  <FileText color={colors.white} size={20} />
                </View>
                <View>
                  <Text style={styles.statsValue}>{cvs.length}</Text>
                  <Text style={styles.statsLabel}>Total CVs</Text>
                </View>
              </LinearGradient>

              <View style={styles.statsRight}>
                <View style={styles.statsRow}>
                  <View style={[styles.statsIconBg, { backgroundColor: colors.primaryGlow }]}>
                    <TrendingUp color={colors.primaryLight} size={14} />
                  </View>
                  <View>
                    <Text style={styles.statsValueSmall}>{new Set(cvs.map(c => c.template_id)).size}</Text>
                    <Text style={styles.statsLabelSmall}>Templates</Text>
                  </View>
                </View>
                <View style={styles.statsDivider} />
                <View style={styles.statsRow}>
                  <View style={[styles.statsIconBg, { backgroundColor: colors.successGlow }]}>
                    <Clock color={colors.success} size={14} />
                  </View>
                  <View>
                    <Text style={styles.statsValueSmall}>{cvs.length > 0 ? timeAgo(cvs[0]?.updated_at) : 'Never'}</Text>
                    <Text style={styles.statsLabelSmall}>Last Update</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Create New CV Button */}
        <Animated.View entering={ZoomIn.delay(500).springify().damping(15)}>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/(tabs)/create')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createBtnGradient}
            >
              <View style={styles.createBtnIcon}>
                <Plus color={colors.primary} size={22} />
              </View>
              <View>
                <Text style={styles.createBtnTitle}>Create New CV</Text>
                <Text style={styles.createBtnSubtitle}>Build your professional resume</Text>
              </View>
              <ChevronRight color="rgba(255,255,255,0.7)" size={20} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(600).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            {QUICK_ACTIONS.map((action, i) => (
              <Animated.View key={i} entering={SlideInRight.delay(700 + i * 80).springify()}>
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => {
                    if (action.action === 'my-cvs') router.push('/(tabs)/my-cvs');
                    else router.push('/(tabs)/create');
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                    {action.icon}
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* AI Banner */}
        <Animated.View entering={FadeInUp.delay(800).duration(400)} style={styles.section}>
          <LinearGradient
            colors={['rgba(37,99,235,0.15)', 'rgba(14,165,233,0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiBanner}
          >
            <View style={styles.aiBannerLeft}>
              <View style={styles.aiIconBg}>
                <Zap color={colors.primaryLight} size={22} />
              </View>
              <View>
                <Text style={styles.aiBannerTitle}>AI-Powered Summaries</Text>
                <Text style={styles.aiBannerDesc}>Generate compelling summaries instantly</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.aiBannerBtn}
              onPress={() => router.push('/(tabs)/create')}
            >
              <Text style={styles.aiBannerBtnText}>Try Now</Text>
              <ChevronRight color={colors.primaryLight} size={14} />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Recent CVs */}
        <Animated.View entering={FadeInUp.delay(900).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent CVs</Text>
            {cvs.length > 3 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/my-cvs')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingState}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : recentCVs.length === 0 ? (
            <Animated.View entering={FadeIn.delay(1000).duration(500)}>
              <EmptyState onPress={() => router.push('/(tabs)/create')} />
            </Animated.View>
          ) : (
            <View style={styles.cvGrid}>
              {recentCVs.map((cv, i) => (
                <Animated.View key={cv.id} entering={ZoomIn.delay(1000 + i * 100).springify().damping(15)}>
                  <CVCard
                    cv={cv}
                    size={recentCVs.length <= 2 ? 'large' : 'small'}
                    onPress={() => router.push({ pathname: '/(tabs)/create', params: { cvId: cv.id } })}
                  />
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Pro Tips */}
        <Animated.View entering={FadeInUp.delay(1100).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>CV Tips</Text>
          <View style={styles.tipsContainer}>
            <TipCard
              icon={<Target color={colors.primaryLight} size={18} />}
              title="Tailor Your CV"
              desc="Customize for each job application"
            />
            <TipCard
              icon={<Award color={colors.success} size={18} />}
              title="Quantify Results"
              desc="Use numbers to show your impact"
            />
            <TipCard
              icon={<Sparkles color={colors.warning} size={18} />}
              title="Keep It Concise"
              desc="1-2 pages maximum"
            />
          </View>
        </Animated.View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CVCard({ cv, size, onPress }: { cv: CV; size: 'large' | 'small'; onPress: () => void }) {
  const templateColors = TEMPLATE_COLORS[cv.template_id] || TEMPLATE_COLORS.classic;
  const isLarge = size === 'large';
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleDownload = async (cv: CV) => {
  try {
    await downloadCVAsPDF(cv);
  } catch (error) {
    console.error('PDF Error:', error);
    Alert.alert('PDF Error', String(error));
  }
};

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.cvCard, isLarge && styles.cvCardLarge]}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
        activeOpacity={1}
      >
        <LinearGradient
          colors={templateColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.cvCardGradient}
        >
          <View style={styles.cvCardHeader}>
            <FileText color={colors.white} size={isLarge ? 28 : 22} />
          </View>
          
          <View style={styles.cvCardContent}>
            <Text style={[styles.cvCardTitle, isLarge && { fontSize: 18 }]} numberOfLines={1}>{cv.title}</Text>
            <Text style={styles.cvCardMeta}>{TEMPLATE_NAMES[cv.template_id] || 'Classic'}</Text>
           <Text style={styles.cvCardDate}>{timeAgo(cv.updated_at)}</Text>

<TouchableOpacity
  onPress={() => handleDownload(cv)}
  style={{
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  }}
>
  <Text
    style={{
      color: 'white',
      fontSize: 11,
      fontWeight: '600',
    }}
  >
    Download PDF
  </Text>
</TouchableOpacity>
</View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function EmptyState({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconBg}>
        <FileText color={colors.textMuted} size={36} />
      </View>
      <Text style={styles.emptyTitle}>No CVs yet</Text>
      <Text style={styles.emptyDesc}>Create your first AI-powered professional CV</Text>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={onPress}
          onPressIn={() => { scale.value = withSpring(0.96); }}
          onPressOut={() => { scale.value = withSpring(1); }}
          activeOpacity={1}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.emptyBtnGradient}
          >
            <Plus color={colors.white} size={16} />
            <Text style={styles.emptyBtnText}>Create First CV</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function TipCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Animated.View entering={FadeInRight.delay(1200).duration(400)}>
      <View style={styles.tipCard}>
        <View style={styles.tipIconBg}>{icon}</View>
        <View>
          <Text style={styles.tipTitle}>{title}</Text>
          <Text style={styles.tipDesc}>{desc}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Missing FadeInRight export workaround
const FadeInRight = FadeIn;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, marginBottom: spacing.lg },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  greetingLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '500', marginBottom: 2 },
  greetingName: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: 0.3 },
  avatarBtn: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.white },
  avatarBadge: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.success, borderWidth: 2.5, borderColor: colors.background },
  statsContainer: { flexDirection: 'row', gap: spacing.sm },
  statsCard: { flex: 1, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statsIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  statsValue: { fontSize: 26, fontWeight: '800', color: colors.white },
  statsLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: -2 },
  statsRight: { flex: 0.85, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  statsRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  statsValueSmall: { fontSize: 18, fontWeight: '700', color: colors.text },
  statsLabelSmall: { fontSize: 11, color: colors.textMuted, fontWeight: '500', marginTop: -2 },
  statsDivider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.md, marginRight: spacing.md },
  createSection: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  createBtn: { borderRadius: radius.lg, overflow: 'hidden', shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 12, marginHorizontal: spacing.lg },
  createBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.md, gap: spacing.md },
  createBtnIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  createBtnTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.white },
  createBtnSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: 0.2 },
  seeAll: { fontSize: 13, fontWeight: '600', color: colors.primaryLight },
  quickActionsRow: { flexDirection: 'row', gap: spacing.sm },
  quickActionCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, gap: 8 },
  quickActionIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  quickActionLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  aiBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  aiBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  aiIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primaryGlow, justifyContent: 'center', alignItems: 'center' },
  aiBannerTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  aiBannerDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  aiBannerBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.primaryGlow, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full },
  aiBannerBtnText: { fontSize: 12, fontWeight: '700', color: colors.primaryLight },
  loadingState: { padding: spacing.xxl, alignItems: 'center' },
  loadingText: { fontSize: 14, color: colors.textMuted },
  emptyState: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, padding: spacing.xl, alignItems: 'center' },
  emptyIconBg: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.surfaceElevated, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  emptyBtn: { borderRadius: radius.md, overflow: 'hidden', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  emptyBtnGradient: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  cvGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cvCard: { width: (width - spacing.lg * 2 - spacing.sm) / 2, height: 130, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cvCardLarge: { width: (width - spacing.lg * 2 - spacing.sm) / 2, height: 150 },
  cvCardGradient: { flex: 1, padding: spacing.md, justifyContent: 'space-between' },
  cvCardHeader: { alignSelf: 'flex-start' },
  cvCardContent: {},
  cvCardTitle: { fontSize: 14, fontWeight: '700', color: colors.white, marginBottom: 2 },
  cvCardMeta: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  cvCardDate: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  tipsContainer: { gap: spacing.sm },
  tipCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  tipIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryGlow, justifyContent: 'center', alignItems: 'center' },
  tipTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  tipDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
