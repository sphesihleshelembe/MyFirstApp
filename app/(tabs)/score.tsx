import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import {
  Gauge,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Shield,
  ChevronRight,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { supabase, CV } from '@/lib/supabase';
import { colors, spacing, radius, typography } from '@/constants/theme';

interface ScoreResult {
  score: number;
  grade: 'Excellent' | 'Good' | 'Average' | 'Weak';
  strengths: string[];
  weaknesses: string[];
  atsIssues: string[];
  improvements: string[];
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'Excellent': return colors.success;
    case 'Good': return '#3B82F6';
    case 'Average': return colors.warning;
    case 'Weak': return colors.error;
    default: return colors.textMuted;
  }
}

function getGradeDescription(grade: string): string {
  switch (grade) {
    case 'Excellent': return 'Your CV is job-ready and well-optimized for ATS systems.';
    case 'Good': return 'Solid CV with minor improvements that could boost your chances.';
    case 'Average': return 'Noticeable gaps that may hurt your ATS score and recruiter impression.';
    case 'Weak': return 'Significant issues need to be fixed before applying to roles.';
    default: return '';
  }
}

// Simple circular progress indicator using two arc views
function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const color = getGradeColor(grade);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <View style={styles.scoreRingContainer}>
      <View style={styles.scoreRingBg}>
        <View style={[styles.scoreRingFill, {
          width: score + '%',
          backgroundColor: color,
        }]} />
      </View>
      <View style={styles.scoreRingInner}>
        <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
        <Text style={styles.scoreOutOf}>/100</Text>
      </View>
    </View>
  );
}

export default function ScoreScreen() {
  const { user } = useAuth();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [selectedCV, setSelectedCV] = useState<CV | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCVs, setLoadingCVs] = useState(true);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [showCVPicker, setShowCVPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      (async () => {
        const { data } = await supabase
          .from('cvs')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        if (data && data.length > 0) {
          setCvs(data as CV[]);
          setSelectedCV(data[0]);
        }
        setLoadingCVs(false);
      })();
    }, [user])
  );

  const analyzeScore = async () => {
    if (!selectedCV) {
      Alert.alert('No CV', 'Create a CV first to analyze its score.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
      const response = await fetch(`${supabaseUrl}/functions/v1/cv-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          summary: selectedCV.summary,
          skills: selectedCV.skills,
          education: selectedCV.education,
          workExperience: selectedCV.work_experience,
          fullName: selectedCV.full_name,
          email: selectedCV.email,
          phone: selectedCV.phone,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data as ScoreResult);
    } catch (e) {
      Alert.alert('Error', 'Failed to analyze CV. Please try again.');
    }
    setLoading(false);
  };

  const gradeColor = result ? getGradeColor(result.grade) : colors.textMuted;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.headerTitle}>CV Score Analyzer</Text>
          <Text style={styles.headerDesc}>Get an ATS-style quality score with actionable feedback</Text>
        </Animated.View>

        {/* CV Selector */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <Text style={styles.sectionLabel}>Select CV to Analyze</Text>
          {selectedCV ? (
            <TouchableOpacity
              style={styles.cvSelector}
              onPress={() => cvs.length > 1 && setShowCVPicker(!showCVPicker)}
              activeOpacity={cvs.length > 1 ? 0.7 : 1}
            >
              <View style={styles.cvSelectorIcon}>
                <FileText color={colors.primaryLight} size={20} />
              </View>
              <View style={styles.cvSelectorInfo}>
                <Text style={styles.cvSelectorTitle} numberOfLines={1}>{selectedCV.title}</Text>
                <Text style={styles.cvSelectorMeta}>
                  {selectedCV.full_name || 'No name'} · {(selectedCV.skills || []).length} skills · {selectedCV.work_experience?.length || 0} roles
                </Text>
              </View>
              {cvs.length > 1 && (
                <ChevronRight color={colors.textMuted} size={18} />
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.cvSelector}>
              <Text style={styles.noCVText}>
                {loadingCVs ? 'Loading...' : 'No CVs found. Create one first.'}
              </Text>
            </View>
          )}

          {showCVPicker && cvs.length > 1 && (
            <View style={styles.cvPicker}>
              {cvs.map(cv => (
                <TouchableOpacity
                  key={cv.id}
                  style={[styles.cvPickerItem, selectedCV?.id === cv.id && styles.cvPickerItemActive]}
                  onPress={() => { setSelectedCV(cv); setShowCVPicker(false); }}
                >
                  <FileText
                    color={selectedCV?.id === cv.id ? colors.primaryLight : colors.textMuted}
                    size={16}
                  />
                  <Text style={[styles.cvPickerItemText, selectedCV?.id === cv.id && styles.cvPickerItemTextActive]} numberOfLines={1}>
                    {cv.title}
                  </Text>
                  {selectedCV?.id === cv.id && <CheckCircle2 color={colors.primaryLight} size={16} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Analyze Button */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <TouchableOpacity
            style={styles.analyzeBtn}
            onPress={analyzeScore}
            disabled={loading || !selectedCV}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                loading || !selectedCV
                  ? [colors.border, colors.borderLight]
                  : [colors.primary, colors.primaryLight]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.analyzeGradient}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Gauge color={colors.white} size={20} />
                  <Text style={styles.analyzeText}>Analyze CV Score</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Results */}
        {result && (
          <Animated.View entering={FadeInUp.delay(100).duration(500)}>
            {/* Score Hero Card */}
            <View style={styles.scoreCard}>
              <ScoreRing score={result.score} grade={result.grade} />

              <Text style={[styles.gradeLabel, { color: gradeColor }]}>
                {result.grade}
              </Text>
              <Text style={styles.gradeDesc}>{getGradeDescription(result.grade)}</Text>

              {/* Score Breakdown Bar */}
              <View style={styles.breakdownBar}>
                <View style={[styles.breakdownFill, { width: `${result.score}%`, backgroundColor: gradeColor }]} />
              </View>

              {/* Category Quick Stats */}
              <View style={styles.quickStats}>
                <QuickStat
                  icon={<CheckCircle2 color={colors.success} size={14} />}
                  value={result.strengths.length}
                  label="Strengths"
                  color={colors.success}
                />
                <QuickStat
                  icon={<XCircle color={colors.error} size={14} />}
                  value={result.weaknesses.length}
                  label="Weaknesses"
                  color={colors.error}
                />
                <QuickStat
                  icon={<Shield color={colors.warning} size={14} />}
                  value={result.atsIssues.length}
                  label="ATS Issues"
                  color={colors.warning}
                />
                <QuickStat
                  icon={<Lightbulb color={colors.primaryLight} size={14} />}
                  value={result.improvements.length}
                  label="Tips"
                  color={colors.primaryLight}
                />
              </View>
            </View>

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <ResultSection
                icon={<Sparkles color={colors.success} size={20} />}
                title="Strengths"
                accentColor={colors.success}
                glowColor={colors.successGlow}
              >
                {result.strengths.map((s, i) => (
                  <FeedbackItem key={i} text={s} color={colors.success} icon="check" />
                ))}
              </ResultSection>
            )}

            {/* Weaknesses */}
            {result.weaknesses.length > 0 && (
              <ResultSection
                icon={<XCircle color={colors.error} size={20} />}
                title="Weaknesses"
                accentColor={colors.error}
                glowColor={colors.errorGlow}
              >
                {result.weaknesses.map((s, i) => (
                  <FeedbackItem key={i} text={s} color={colors.error} icon="x" />
                ))}
              </ResultSection>
            )}

            {/* ATS Issues */}
            {result.atsIssues.length > 0 && (
              <ResultSection
                icon={<Shield color={colors.warning} size={20} />}
                title="ATS Issues"
                accentColor={colors.warning}
                glowColor={'rgba(245, 158, 11, 0.08)'}
              >
                {result.atsIssues.map((s, i) => (
                  <FeedbackItem key={i} text={s} color={colors.warning} icon="alert" />
                ))}
              </ResultSection>
            )}

            {/* Improvements */}
            {result.improvements.length > 0 && (
              <ResultSection
                icon={<ArrowUpRight color={colors.primaryLight} size={20} />}
                title="Improvements"
                accentColor={colors.primaryLight}
                glowColor={colors.primaryGlow}
              >
                {result.improvements.map((s, i) => (
                  <FeedbackItem key={i} text={s} color={colors.primaryLight} icon="tip" index={i + 1} />
                ))}
              </ResultSection>
            )}
          </Animated.View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickStat({ icon, value, label, color }: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.quickStat}>
      {icon}
      <Text style={[styles.quickStatNum, { color }]}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );
}

function ResultSection({ icon, title, accentColor, glowColor, children }: {
  icon: React.ReactNode;
  title: string;
  accentColor: string;
  glowColor: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.resultSection, { borderColor: accentColor + '22' }]}>
      <View style={styles.resultSectionHeader}>
        <View style={[styles.resultSectionIcon, { backgroundColor: glowColor }]}>{icon}</View>
        <Text style={[styles.resultSectionTitle, { color: accentColor }]}>{title}</Text>
      </View>
      <View style={styles.resultSectionContent}>{children}</View>
    </View>
  );
}

function FeedbackItem({ text, color, icon, index }: {
  text: string;
  color: string;
  icon: 'check' | 'x' | 'alert' | 'tip';
  index?: number;
}) {
  return (
    <View style={styles.feedbackItem}>
      <View style={[styles.feedbackBullet, { backgroundColor: color + '18' }]}>
        {icon === 'check' && <CheckCircle2 color={color} size={14} />}
        {icon === 'x' && <XCircle color={color} size={14} />}
        {icon === 'alert' && <AlertTriangle color={color} size={14} />}
        {icon === 'tip' && index != null && (
          <Text style={[styles.feedbackBulletNum, { color }]}>{index}</Text>
        )}
      </View>
      <Text style={styles.feedbackText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg },

  // Header
  headerTitle: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: 0.3 },
  headerDesc: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl },

  // Sections
  section: { marginBottom: spacing.xl },
  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm,
  },

  // CV Selector
  cvSelector: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border,
    padding: spacing.md, gap: spacing.md,
  },
  cvSelectorIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryGlow,
    justifyContent: 'center', alignItems: 'center',
  },
  cvSelectorInfo: { flex: 1 },
  cvSelectorTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cvSelectorMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  noCVText: { fontSize: 14, color: colors.textMuted, paddingVertical: spacing.sm },

  // CV Picker
  cvPicker: {
    marginTop: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  cvPickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  cvPickerItemActive: { backgroundColor: colors.primaryGlow },
  cvPickerItemText: { flex: 1, fontSize: 14, color: colors.textSecondary },
  cvPickerItemTextActive: { color: colors.primaryLight, fontWeight: '600' },

  // Analyze Button
  analyzeBtn: {
    borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.xl,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  analyzeGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.md + 2,
  },
  analyzeText: { fontSize: 17, fontWeight: '700', color: colors.white },

  // Score Card
  scoreCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1,
    borderColor: colors.border, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg,
  },
  scoreRingContainer: {
    width: 120, height: 120, justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreRingBg: {
    position: 'absolute', width: 120, height: 16, borderRadius: 8,
    backgroundColor: colors.surfaceElevated, overflow: 'hidden',
    top: 52,
  },
  scoreRingFill: {
    height: '100%', borderRadius: 8,
  },
  scoreRingInner: { flexDirection: 'row', alignItems: 'baseline' },
  scoreNumber: { fontSize: 40, fontWeight: '800' },
  scoreOutOf: { fontSize: 16, fontWeight: '600', color: colors.textMuted, marginLeft: 2 },
  gradeLabel: { fontSize: 22, fontWeight: '700', marginBottom: spacing.xs },
  gradeDesc: {
    fontSize: 13, color: colors.textSecondary, textAlign: 'center',
    lineHeight: 20, maxWidth: 300, marginBottom: spacing.lg,
  },

  // Breakdown Bar
  breakdownBar: {
    width: '100%', height: 6, borderRadius: 3, backgroundColor: colors.surfaceElevated,
    overflow: 'hidden', marginBottom: spacing.lg,
  },
  breakdownFill: { height: '100%', borderRadius: 3 },

  // Quick Stats
  quickStats: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    width: '100%', paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border,
  },
  quickStat: { flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 },
  quickStatNum: { fontSize: 20, fontWeight: '800' },
  quickStatLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Result Sections
  resultSection: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
    padding: spacing.md, marginBottom: spacing.md,
  },
  resultSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md,
  },
  resultSectionIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  resultSectionTitle: { fontSize: 16, fontWeight: '700' },
  resultSectionContent: { gap: spacing.sm },

  // Feedback Items
  feedbackItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
  },
  feedbackBullet: {
    width: 24, height: 24, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  feedbackBulletNum: { fontSize: 11, fontWeight: '700' },
  feedbackText: { flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});

