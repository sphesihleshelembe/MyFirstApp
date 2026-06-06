import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  SlideInRight,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { FileText, Plus, Trash2, Edit, Folder, Clock, Layers } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase, CV } from '@/lib/supabase';
import { colors, spacing, radius, typography } from '@/constants/theme';

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

export default function MyCVsScreen() {
  const { user } = useAuth();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const fetchCVs = async () => {
    if (!user) return;
    const { data } = await supabase.from('cvs').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (data) setCvs(data as CV[]);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchCVs();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCVs();
    setRefreshing(false);
  };

  const deleteCV = (cv: CV) => {
    Alert.alert('Delete CV', `Delete "${cv.title}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('cvs').delete().eq('id', cv.id);
          setCvs(cvs.filter(c => c.id !== cv.id));
        },
      },
    ]);
  };
  const filteredCVs = filter ? cvs.filter(c => c.template_id === filter) : cvs;
  const templatesUsed = [...new Set(cvs.map(c => c.template_id))];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>My CVs</Text>
            <Text style={styles.headerCount}>{cvs.length} CV{cvs.length !== 1 ? 's' : ''} saved</Text>
          </View>
          <Animated.View entering={ZoomIn.delay(200).springify()}>
            <TouchableOpacity
              style={styles.newBtn}
              onPress={() => router.push('/(tabs)/create')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.newBtnGradient}
              >
                <Plus color={colors.white} size={18} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Filter Pills */}
        {templatesUsed.length > 0 && (
          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              <TouchableOpacity
                style={[styles.filterPill, !filter && styles.filterPillActive]}
                onPress={() => setFilter(null)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, !filter && styles.filterPillTextActive]}>All</Text>
              </TouchableOpacity>
              {templatesUsed.map((t, i) => (
                <Animated.View key={t} entering={ZoomIn.delay(400 + i * 80).springify()}>
                  <TouchableOpacity
                    style={[styles.filterPill, filter === t && styles.filterPillActive]}
                    onPress={() => setFilter(filter === t ? null : t)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterPillText, filter === t && styles.filterPillTextActive]}>
                      {TEMPLATE_NAMES[t] || t}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.emptyState}><Text style={styles.emptyText}>Loading...</Text></View>
        ) : filteredCVs.length === 0 ? (
          <Animated.View entering={FadeIn.delay(400).duration(500)}>
            <EmptyState filter={filter} onPress={() => router.push('/(tabs)/create')} />
          </Animated.View>
        ) : (
          <View style={styles.list}>
            {filteredCVs.map((cv, i) => (
              <Animated.View key={cv.id} entering={SlideInRight.delay(400 + i * 100).springify().damping(15)}>
                <CVItem
                  cv={cv}
                  isFirst={i === 0}
                  onEdit={() => router.push({ pathname: '/(tabs)/create', params: { cvId: cv.id } })}
                  onDelete={() => deleteCV(cv)}
                />
              </Animated.View>
            ))}
          </View>
        )}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CVItem({ cv, isFirst, onEdit, onDelete }: {
  cv: CV;
  isFirst: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const templateColors = TEMPLATE_COLORS[cv.template_id] || TEMPLATE_COLORS.classic;
  const date = new Date(cv.updated_at);
  const updated = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.cvCard, isFirst && styles.cvCardFirst]}
        onPress={onEdit}
        onPressIn={() => { scale.value = withSpring(0.98, { damping: 15, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
        activeOpacity={1}
      >
        <View style={styles.cvCardInner}>
          {/* Icon */}
          <LinearGradient
            colors={templateColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cvIcon}
          >
            <FileText color={colors.white} size={24} />
            {isFirst && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Latest</Text>
              </View>
            )}
          </LinearGradient>

          {/* Info */}
          <View style={styles.cvInfo}>
            <View style={styles.cvInfoTop}>
              <Text style={styles.cvTitle} numberOfLines={1}>{cv.title}</Text>
              <TouchableOpacity style={styles.moreBtn} onPress={onDelete}>
                <Trash2 color={colors.textMuted} size={16} />
              </TouchableOpacity>
            </View>
            <View style={styles.cvMeta}>
              <View style={styles.cvMetaItem}>
                <Layers color={colors.textMuted} size={12} />
                <Text style={styles.cvMetaText}>{TEMPLATE_NAMES[cv.template_id] || 'Classic'}</Text>
              </View>
              <View style={styles.cvMetaDot} />
              <View style={styles.cvMetaItem}>
                <Clock color={colors.textMuted} size={12} />
                <Text style={styles.cvMetaText}>{updated}</Text>
              </View>
            </View>
            {cv.full_name ? <Text style={styles.cvName} numberOfLines={1}>{cv.full_name}</Text> : null}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.cvActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={onEdit} activeOpacity={0.7}>
            <Edit color={colors.primaryLight} size={16} />
            <Text style={[styles.actionBtnText, { color: colors.primaryLight }]}>Edit</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function EmptyState({ filter, onPress }: { filter: string | null; onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconBg}>
        <Folder color={colors.textMuted} size={48} />
      </View>
      <Text style={styles.emptyTitle}>{filter ? 'No CVs in this template' : 'No CVs yet'}</Text>
      <Text style={styles.emptyDesc}>
        {filter ? 'Try selecting a different filter or create a new CV' : 'Create your first AI-powered CV to get started'}
      </Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md },
  headerTitle: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: 0.3 },
  headerCount: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  newBtn: { borderRadius: 14, overflow: 'hidden', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  newBtnGradient: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  filters: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterPillActive: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  filterPillText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterPillTextActive: { color: colors.primaryLight },
  scrollContent: { padding: spacing.lg },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl * 1.5 },
  emptyIconBg: { width: 88, height: 88, borderRadius: 28, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  emptyDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg, maxWidth: 260 },
  emptyText: { fontSize: 14, color: colors.textMuted },
  emptyBtn: { borderRadius: radius.lg, overflow: 'hidden' },
  emptyBtnGradient: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
  list: { gap: spacing.md },
  cvCard: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  cvCardFirst: { borderColor: colors.borderLight },
  cvCardInner: { flexDirection: 'row', padding: spacing.md },
  cvIcon: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center', position: 'relative', flexShrink: 0 },
  badge: { position: 'absolute', top: -6, right: -6, backgroundColor: colors.success, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 2, borderColor: colors.surface },
  badgeText: { fontSize: 9, fontWeight: '700', color: colors.white, textTransform: 'uppercase', letterSpacing: 0.5 },
  cvInfo: { flex: 1, marginLeft: spacing.md, justifyContent: 'space-between' },
  cvInfoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cvTitle: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },
  moreBtn: { padding: spacing.xs },
  cvMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  cvMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cvMetaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted },
  cvMetaText: { fontSize: 12, color: colors.textMuted },
  cvName: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  cvActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surfaceElevated },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.sm },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
});
