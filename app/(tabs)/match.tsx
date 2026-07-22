import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  SlideInRight,
} from 'react-native-reanimated';
import {
  Search,
  Target,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Zap,
  FileText,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { supabase, CV } from '@/lib/supabase';
import { colors, spacing, radius, typography } from '@/constants/theme';

interface MatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  keywordsFromJob: string[];
  cvStrengthsForJob: string[];
  recommendations: string[];
}

function getScoreColor(score: number): string {
  if (score >= 90) return colors.success;
  if (score >= 70) return '#3B82F6';
  if (score >= 50) return colors.warning;
  return colors.error;
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent Match';
  if (score >= 70) return 'Strong Match';
  if (score >= 50) return 'Moderate Match';
  return 'Weak Match';
}

function getScoreDescription(score: number): string {
  if (score >= 90) return 'Your CV aligns exceptionally well with this role. You should apply with confidence.';
  if (score >= 70) return 'Good alignment with several key requirements. Minor improvements could strengthen your application.';
  if (score >= 50) return 'Some relevant experience, but notable gaps exist. Focus on the recommendations below.';
  return 'Significant gaps between your CV and this role. Consider the recommendations before applying.';
}

export default function MatchScreen() {
  const { user } = useAuth();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [selectedCV, setSelectedCV] = useState<CV | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCVs, setLoadingCVs] = useState(true);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [showCVPicker, setShowCVPicker] = useState(false);

useFocusEffect(
  useCallback(() => {
    if (!user) return;

    setLoadingCVs(true);

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
  const analyzeMatch = async () => {
  if (!selectedCV) {
    Alert.alert('No CV', 'Please create a CV first before matching.');
    return;
  }

  if (!jobDescription.trim()) {
    Alert.alert(
      'Missing Job Description',
      'Paste a job description to analyze the match.'
    );
    return;
  }

  setLoading(true);
  setResult(null);

  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      Alert.alert(
        'Config Error',
        'Missing Supabase environment variables'
      );
      return;
    }
    console.log("CALLING JOB MATCH FUNCTION");
console.log("URL:", `${supabaseUrl}/functions/v1/job-match`);

    const response = await fetch(
      `${supabaseUrl}/functions/v1/job-match`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey,
        },
        body: JSON.stringify({
          summary: selectedCV.summary || '',
          skills: selectedCV.skills || [],
          education: selectedCV.education || '',
          workExperience: selectedCV.work_experience || '',
          jobDescription,
        }),
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    console.log("RAW MATCH RESPONSE:");
    console.log(JSON.stringify(data, null, 2));

    if (data.error) throw new Error(data.error);

    setResult(data as MatchResult);
  } catch (e) {
    Alert.alert(
      'Error',
      'Failed to analyze job match. Please try again.'
    );
  } finally {
    setLoading(false);
  }
};
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Text style={styles.headerTitle}>Job Match Checker</Text>
            <Text style={styles.headerDesc}>See how well your CV matches a job posting</Text>
          </Animated.View>

          {/* CV Selector */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
            <Text style={styles.sectionLabel}>Selected CV</Text>
            {selectedCV ? (
              <TouchableOpacity
                style={styles.cvSelector}
onPress={() => {
  if (cvs.length > 1) {
    setShowCVPicker(prev => !prev);
  }
}}               
activeOpacity={cvs.length > 1 ? 0.7 : 1}
              >
                <View style={styles.cvSelectorIcon}>
                  <FileText color={colors.primaryLight} size={20} />
                </View>
                <View style={styles.cvSelectorInfo}>
                  <Text style={styles.cvSelectorTitle} numberOfLines={1}>{selectedCV.title}</Text>
                  <Text style={styles.cvSelectorMeta}>
                    {selectedCV.full_name || 'No name'} · {(selectedCV.skills || []).length} skills
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

            {/* CV Picker Dropdown */}
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

          {/* Job Description Input */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
            <Text style={styles.sectionLabel}>Job Description</Text>
            <View style={styles.jdInputContainer}>
              <TextInput
                style={styles.jdInput}
                value={jobDescription}
                onChangeText={setJobDescription}
                placeholder="Paste the full job description here..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                selectionColor={colors.primary}
              />
              {jobDescription.length > 0 && (
                <Text style={styles.charCount}>{jobDescription.length} characters</Text>
              )}
            </View>
          </Animated.View>

          {/* Analyze Button */}
          <Animated.View entering={FadeInUp.delay(400).duration(400)}>
            <TouchableOpacity
              style={styles.analyzeBtn}
              onPress={analyzeMatch}
              disabled={loading || !selectedCV || !jobDescription.trim()}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  loading || !selectedCV || !jobDescription.trim()
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
                    <Target color={colors.white} size={20} />
                    <Text style={styles.analyzeText}>Analyze Match</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Results */}
          {result && (
            <Animated.View entering={FadeInUp.delay(100).duration(500)}>
              {/* Score Card */}
              <View style={styles.scoreCard}>
                <View style={styles.scoreCircleWrap}>
                  <LinearGradient
                    colors={[getScoreColor(result.matchScore), getScoreColor(result.matchScore) + '88']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.scoreCircle}
                  >
                    <Text style={styles.scoreNumber}>{result.matchScore}</Text>
                  </LinearGradient>
                </View>
                <Text style={[styles.scoreLabel, { color: getScoreColor(result.matchScore) }]}>
                  {getScoreLabel(result.matchScore)}
                </Text>
                <Text style={styles.scoreDesc}>{getScoreDescription(result.matchScore)}</Text>

                {/* Quick Stats */}
                <View style={styles.quickStats}>
                  <View style={styles.quickStat}>
                    <CheckCircle2 color={colors.success} size={16} />
                    <Text style={styles.quickStatNum}>{result.matchedSkills.length}</Text>
                    <Text style={styles.quickStatLabel}>Matched</Text>
                  </View>
                  <View style={styles.quickStatDivider} />
                  <View style={styles.quickStat}>
                    <XCircle color={colors.error} size={16} />
                    <Text style={styles.quickStatNum}>{result.missingSkills.length}</Text>
                    <Text style={styles.quickStatLabel}>Missing</Text>
                  </View>
                  <View style={styles.quickStatDivider} />
                  <View style={styles.quickStat}>
                    <Search color={colors.primaryLight} size={16} />
                    <Text style={styles.quickStatNum}>{result.keywordsFromJob.length}</Text>
                    <Text style={styles.quickStatLabel}>Keywords</Text>
                  </View>
                </View>
              </View>

              {/* Matched Skills */}
              {result.matchedSkills.length > 0 && (
                <ResultSection
                  icon={<CheckCircle2 color={colors.success} size={22} />}
                  title="Matched Skills"
                  titleColor={colors.success}
                >
                  <View style={styles.tagWrap}>
                    {result.matchedSkills.map((s, i) => (
                      <View key={i} style={[styles.tag, styles.tagMatched]}>
                        <Text style={styles.tagTextMatched}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </ResultSection>
              )}

              {/* Missing Skills */}
              {result.missingSkills.length > 0 && (
                <ResultSection
                  icon={<XCircle color={colors.error} size={22} />}
                  title="Missing Skills"
                  titleColor={colors.error}
                >
                  <View style={styles.tagWrap}>
                    {result.missingSkills.map((s, i) => (
                      <View key={i} style={[styles.tag, styles.tagMissing]}>
                        <Text style={styles.tagTextMissing}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </ResultSection>
              )}

              {/* CV Strengths */}
              {result.cvStrengthsForJob.length > 0 && (
                <ResultSection
                  icon={<TrendingUp color={colors.primaryLight} size={22} />}
                  title="Your Strengths for This Job"
                  titleColor={colors.primaryLight}
                >
                  {result.cvStrengthsForJob.map((s, i) => (
                    <View key={i} style={styles.listItem}>
                      <View style={styles.listBullet}>
                        <Zap color={colors.primaryLight} size={12} />
                      </View>
                      <Text style={styles.listText}>{s}</Text>
                    </View>
                  ))}
                </ResultSection>
              )}

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <ResultSection
                  icon={<Lightbulb color={colors.warning} size={22} />}
                  title="Recommendations"
                  titleColor={colors.warning}
                >
                  {result.recommendations.map((r, i) => (
                    <View key={i} style={styles.listItem}>
                      <View style={[styles.listBullet, styles.listBulletWarning]}>
                        <Text style={styles.listBulletNum}>{i + 1}</Text>
                      </View>
                      <Text style={styles.listText}>{r}</Text>
                    </View>
                  ))}
                </ResultSection>
              )}
            </Animated.View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ResultSection({ icon, title, titleColor, children }: {
  icon: React.ReactNode;
  title: string;
  titleColor: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.resultSection}>
      <View style={styles.resultSectionHeader}>
        <View style={styles.resultSectionIcon}>{icon}</View>
        <Text style={[styles.resultSectionTitle, { color: titleColor }]}>{title}</Text>
      </View>
      {children}
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

  // Job Description Input
  jdInputContainer: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden',
  },
  jdInput: {
    padding: spacing.md, fontSize: 14, color: colors.text,
    minHeight: 160, textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11, color: colors.textMuted, textAlign: 'right',
    paddingRight: spacing.md, paddingBottom: spacing.sm,
  },

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
  scoreCircleWrap: { marginBottom: spacing.md },
  scoreCircle: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
  },
  scoreNumber: { fontSize: 36, fontWeight: '800', color: colors.white },
  scoreLabel: { fontSize: 20, fontWeight: '700', marginBottom: spacing.xs },
  scoreDesc: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 300 },

  // Quick Stats
  quickStats: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.lg, gap: spacing.md, width: '100%',
    paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border,
  },
  quickStat: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' },
  quickStatDivider: { width: 1, height: 24, backgroundColor: colors.border },
  quickStatNum: { fontSize: 18, fontWeight: '700', color: colors.text },
  quickStatLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },

  // Result Sections
  resultSection: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md,
  },
  resultSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md,
  },
  resultSectionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceElevated, justifyContent: 'center', alignItems: 'center' },
  resultSectionTitle: { fontSize: 16, fontWeight: '700' },

  // Tags
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full },
  tagMatched: { backgroundColor: colors.successGlow, borderWidth: 1, borderColor: colors.success + '44' },
  tagMissing: { backgroundColor: colors.errorGlow, borderWidth: 1, borderColor: colors.error + '44' },
  tagTextMatched: { fontSize: 13, fontWeight: '600', color: colors.success },
  tagTextMissing: { fontSize: 13, fontWeight: '600', color: colors.error },

  // List Items
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  listBullet: {
    width: 24, height: 24, borderRadius: 8, backgroundColor: colors.primaryGlow,
    justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  listBulletWarning: { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
  listBulletNum: { fontSize: 11, fontWeight: '700', color: colors.warning },
  listText: { flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});

