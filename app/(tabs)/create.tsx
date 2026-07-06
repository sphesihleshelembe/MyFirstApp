import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Users,
  Sparkles,
  Plus,
  Trash2,
  Save,
  FileText,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Layers,
  Calendar,
  Building,
  Crown,
  Lock,
  Heart,
  Eye,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase, CV, EducationEntry, WorkExperienceEntry, ReferenceEntry } from '@/lib/supabase';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { CV_TEMPLATES, CVTemplate, isPremiumTemplate } from '@/lib/templates';
import {
  saveDraftCV,
  getDraftCV,
  clearDraftCV,
  DraftCV,
  convertDraftToCV,
  convertCVToDraft,
} from '@/lib/storage';
import { generatePDFHtml, triggerPDFDownload } from '@/lib/pdf-generator';
import { RewardedAdModal } from '@/components/RewardedAdModal';
import { syncCVsToCloud } from '@/lib/syncCVs';
import NetInfo from '@react-native-community/netinfo';

const { width } = Dimensions.get('window');

const SECTIONS = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'skills', label: 'Skills', icon: Sparkles },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'references', label: 'References', icon: Users },
  { id: 'template', label: 'Template', icon: Layers },
];

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export default function CreateScreen() {
  const { user } = useAuth();
  const { cvId } = useLocalSearchParams<{ cvId?: string }>();
  const [activeSection, setActiveSection] = useState(0);
  const [saving, setSaving] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(cvId || null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  const [title, setTitle] = useState('My Professional CV');
  const [templateId, setTemplateId] = useState('classic');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [workExp, setWorkExp] = useState<WorkExperienceEntry[]>([]);
  const [references, setReferences] = useState<ReferenceEntry[]>([]);

  const [showRewardedAd, setShowRewardedAd] = useState(false);
  const [pendingAction, setPendingAction] = useState<'template' | 'ai' | null>(null);
  const [selectedPremiumTemplate, setSelectedPremiumTemplate] = useState<string | null>(null);
  const [favoriteTemplates, setFavoriteTemplates] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // CV completion score: each category contributes a portion toward 100%
  const completionScore = useMemo(() => {
    let score = 0;
    // Personal info: 4 fields × 7% = 28%
    if (fullName.trim()) score += 7;
    if (phone.trim()) score += 7;
    if (email.trim()) score += 7;
    if (address.trim()) score += 7;
    // Skills: up to 15% (5% per skill, max 3)
    score += Math.min(skills.length * 5, 15);
    // Education: up to 15% (15% for ≥1 entry)
    if (education.length > 0) score += 15;
    // Work experience: up to 20% (20% for ≥1 entry)
    if (workExp.length > 0) score += 20;
    // Summary: 12%
    if (summary.trim().length >= 20) score += 12;
    // References: 5%
    if (references.length > 0) score += 5;
    // Template chosen (non-default or explicitly set): 0 — always has a value, give credit for reaching template step
    return Math.min(score, 100);
  }, [fullName, phone, email, address, skills, education, workExp, summary, references]);

  useEffect(() => {
    if (cvId) {
      loadCV(cvId);
    } else {
      loadDraft();
    }
  }, [cvId]);


  useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && user?.id) {
      syncCVsToCloud(user.id);
    }
  });

  return () => unsubscribe();
}, [user]);

  useEffect(() => {
    if (user) loadFavorites();
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorite_templates')
      .select('template_id')
      .eq('user_id', user.id);
    if (data) setFavoriteTemplates(new Set(data.map((r: { template_id: string }) => r.template_id)));
  };

  const toggleFavorite = async (templateId: string, e: any) => {
    e.stopPropagation?.();
    if (!user) return;
    const isFav = favoriteTemplates.has(templateId);
    // Optimistic update
    setFavoriteTemplates(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(templateId);
      else next.add(templateId);
      return next;
    });
    if (isFav) {
      await supabase.from('favorite_templates').delete()
        .eq('user_id', user.id).eq('template_id', templateId);
    } else {
      await supabase.from('favorite_templates').insert({ user_id: user.id, template_id: templateId });
    }
  };

  const loadDraft = async () => {
    const draft = await getDraftCV();
    if (draft) {
      setTitle(draft.title);
      setTemplateId(draft.template_id);
      setFullName(draft.full_name);
      setPhone(draft.phone);
      setEmail(draft.email);
      setAddress(draft.address);
      setSummary(draft.summary);
      setSkills(draft.skills);
      setEducation(draft.education);
      setWorkExp(draft.work_experience);
      setReferences(draft.references_data);
    }
  };

  const loadCV = async (id: string) => {
    const { data } = await supabase.from('cvs').select('*').eq('id', id).maybeSingle();
    if (data) {
      setTitle(data.title);
      setTemplateId(data.template_id);
      setFullName(data.full_name);
      setPhone(data.phone);
      setEmail(data.email);
      setAddress(data.address);
      setSummary(data.summary);
      setSkills(data.skills || []);
      setEducation(data.education || []);
      setWorkExp(data.work_experience || []);
      setReferences(data.references_data || []);
      if (data.template_id) setSavedId(data.id);
    }
  };

  const autoSave = useCallback(async () => {
    const draftData: Partial<DraftCV> = {
      title,
      template_id: templateId,
      full_name: fullName,
      phone,
      email,
      address,
      summary,
      skills,
      education,
      work_experience: workExp,
      references_data: references,
    };
    await saveDraftCV(draftData);
    setLastAutoSave(new Date());
  }, [title, templateId, fullName, phone, email, address, summary, skills, education, workExp, references]);

  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      autoSave();
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSave]);

  const saveCV = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      title,
      template_id: templateId,
      full_name: fullName,
      phone,
      email,
      address,
      summary,
      skills,
      education,
      work_experience: workExp,
      references_data: references,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (savedId) {
      const res = await supabase.from('cvs').update(payload).eq('id', savedId);
      error = res.error;
    } else {
      const res = await supabase.from('cvs').insert(payload).select('id').single();
      error = res.error;
      if (!error && res.data) setSavedId(res.data.id);
    }

    setSaving(false);
    if (error) {
      Alert.alert('Error', 'Failed to save CV. Please try again.');
    } else {
      await clearDraftCV();
      Alert.alert('Saved!', 'Your CV has been saved successfully.');
    }
  };

  const generateAISummary = async () => {
    if (!fullName && !workExp.length && !skills.length) {
      Alert.alert('Add more details', 'Please fill in your name, skills, and work experience first to generate a meaningful summary.');
      return;
    }

    setGeneratingSummary(true);
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          fullName,
          skills,
          workExperience: workExp,
          education,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary);
        await persistSummary(data.summary);
      }
      else throw new Error(data.error || 'No summary returned');
    } catch (e) {
      Alert.alert('Error', 'Failed to generate summary. Please try again.');
    }
    setGeneratingSummary(false);
  };

  const persistSummary = async (newSummary: string) => {
    await saveDraftCV({ summary: newSummary });
    setLastAutoSave(new Date());
    if (savedId && user) {
      await supabase.from('cvs').update({ summary: newSummary, updated_at: new Date().toISOString() }).eq('id', savedId);
    }
  };

  const handleAIGeneration = () => {
    setPendingAction('ai');
    setShowRewardedAd(true);
  };

  const handleSelectTemplate = (template: CVTemplate) => {
    // Show preview modal first
    setPreviewTemplateId(template.id);
    setShowPreview(true);
  };

  const confirmTemplateSelection = () => {
    const template = CV_TEMPLATES.find(t => t.id === previewTemplateId);
    if (!template) return;

    setShowPreview(false);
    if (template.isPremium) {
      setSelectedPremiumTemplate(template.id);
      setPendingAction('template');
      setShowRewardedAd(true);
    } else {
      setTemplateId(template.id);
    }
    setPreviewTemplateId(null);
  };

  const cancelTemplatePreview = () => {
    setShowPreview(false);
    setPreviewTemplateId(null);
  };

  const handleRewardEarned = () => {
    setShowRewardedAd(false);
    if (pendingAction === 'template' && selectedPremiumTemplate) {
      setTemplateId(selectedPremiumTemplate);
      setSelectedPremiumTemplate(null);
    } else if (pendingAction === 'ai') {
      executeAIGeneration();
    }
    setPendingAction(null);
  };

  const executeAIGeneration = async () => {
    setGeneratingSummary(true);
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          fullName,
          skills,
          workExperience: workExp,
          education,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary);
        await persistSummary(data.summary);
      }
      else throw new Error(data.error || 'No summary returned');
    } catch (e) {
      Alert.alert('Error', 'Failed to generate summary. Please try again.');
    }
    setGeneratingSummary(false);
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => setSkills(skills.filter(s => s !== skill));

  const addEducation = () =>
    setEducation([...education, { id: generateId(), institution: '', degree: '', field: '', start_year: '', end_year: '', description: '' }]);

  const updateEducation = (id: string, key: keyof EducationEntry, value: string) =>
    setEducation(education.map(e => (e.id === id ? { ...e, [key]: value } : e)));

  const removeEducation = (id: string) => setEducation(education.filter(e => e.id !== id));

  const addWorkExp = () =>
    setWorkExp([...workExp, { id: generateId(), company: '', position: '', start_date: '', end_date: '', current: false, description: '' }]);

  const updateWorkExp = (id: string, key: keyof WorkExperienceEntry, value: any) =>
    setWorkExp(workExp.map(e => (e.id === id ? { ...e, [key]: value } : e)));

  const removeWorkExp = (id: string) => setWorkExp(workExp.filter(e => e.id !== id));

  const addReference = () =>
    setReferences([...references, { id: generateId(), name: '', position: '', company: '', email: '', phone: '' }]);

  const updateReference = (id: string, key: keyof ReferenceEntry, value: string) =>
    setReferences(references.map(r => (r.id === id ? { ...r, [key]: value } : r)));

  const removeReference = (id: string) => setReferences(references.filter(r => r.id !== id));

  const nextSection = () => setActiveSection(Math.min(SECTIONS.length - 1, activeSection + 1));
  const prevSection = () => setActiveSection(Math.max(0, activeSection - 1));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={prevSection}>
          <ChevronLeft color={colors.textSecondary} size={22} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{cvId ? 'Edit CV' : 'Create CV'}</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="CV Title"
            placeholderTextColor={colors.textMuted}
          />
          {lastAutoSave && (
            <Text style={styles.autoSaveText}>Auto-saved {formatTimeAgo(lastAutoSave)}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={saveCV} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={colors.primaryLight} size="small" />
          ) : (
            <>
              <Save color={colors.primaryLight} size={18} />
              <Text style={styles.saveBtnText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* CV Completion Meter */}
      <View style={styles.completionBar}>
        <View style={styles.completionLabelRow}>
          <Text style={styles.completionLabel}>CV Completion</Text>
          <Text style={[
            styles.completionPct,
            completionScore >= 80 ? { color: colors.success } :
            completionScore >= 40 ? { color: colors.warning } :
            { color: colors.textMuted }
          ]}>{completionScore}%</Text>
        </View>
        <View style={styles.completionTrack}>
          <View
            style={[
              styles.completionFill,
              { width: `${completionScore}%` as any },
              completionScore >= 80 ? { backgroundColor: colors.success } :
              completionScore >= 40 ? { backgroundColor: colors.warning } :
              { backgroundColor: colors.primary }
            ]}
          />
        </View>
        {/* Step dots */}
        <View style={styles.completionDots}>
          {SECTIONS.map((_, i) => (
            <View key={i} style={[
              styles.completionDot,
              i < activeSection && styles.completionDotDone,
              i === activeSection && styles.completionDotActive,
            ]} />
          ))}
        </View>
      </View>

      {/* Section Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabs}
        contentContainerStyle={styles.tabsContent}
      >
        {SECTIONS.map((section, i) => {
          const Icon = section.icon;
          return (
            <TouchableOpacity
              key={section.id}
              style={[styles.tab, activeSection === i && styles.tabActive]}
              onPress={() => setActiveSection(i)}
            >
              <Icon color={activeSection === i ? colors.primaryLight : colors.textMuted} size={14} />
              <Text style={[styles.tabText, activeSection === i && styles.tabTextActive]}>{section.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={styles.bodyContent}>
          {/* Personal Section */}
          {activeSection === 0 && (
            <View style={styles.section}>
              <SectionHeader icon={<User color={colors.primaryLight} size={22} />} title="Personal Information" subtitle="Your contact details" />
              <View style={styles.formGroup}>
                <InputField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="John Doe" icon={<User color={colors.textMuted} size={18} />} />
                <InputField label="Phone" value={phone} onChangeText={setPhone} placeholder="+1 (555) 000-0000" keyboardType="phone-pad" icon={<Phone color={colors.textMuted} size={18} />} />
                <InputField label="Email" value={email} onChangeText={setEmail} placeholder="you@company.com" keyboardType="email-address" autoCapitalize="none" icon={<Mail color={colors.textMuted} size={18} />} />
                <InputField label="Address" value={address} onChangeText={setAddress} placeholder="City, Country" icon={<MapPin color={colors.textMuted} size={18} />} />
              </View>
            </View>
          )}

          {/* Summary Section */}
          {activeSection === 4 && (
            <View style={styles.section}>
              <SectionHeader icon={<FileText color={colors.primaryLight} size={22} />} title="Professional Summary" subtitle="Your career highlights" />
              <TouchableOpacity style={styles.aiBtn} onPress={handleAIGeneration} disabled={generatingSummary}>
                <LinearGradient
                  colors={generatingSummary ? ['#334155', '#475569'] : [colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.aiBtnGradient}
                >
                  <View style={styles.aiBtnIcon}>
                    {generatingSummary ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Sparkles color={colors.primary} size={18} />
                    )}
                  </View>
                  <Text style={styles.aiBtnText}>
                    {generatingSummary ? 'Generating...' : 'Generate with AI (Watch Ad)'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <TextAreaField
                label="Summary"
                value={summary}
                onChangeText={setSummary}
                placeholder="Write a compelling professional summary or tap Generate with AI..."
                hint="3-4 sentences highlighting your experience and goals"
              />
            </View>
          )}

          {/* Skills Section */}
          {activeSection === 1 && (
            <View style={styles.section}>
              <SectionHeader icon={<Sparkles color={colors.primaryLight} size={22} />} title="Skills" subtitle="Your key competencies" />
              <View style={styles.skillInputRow}>
                <TextInput
                  style={styles.skillInput}
                  value={skillInput}
                  onChangeText={setSkillInput}
                  placeholder="Type a skill and press Add"
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={addSkill}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.addSkillBtn} onPress={addSkill}>
                  <Text style={styles.addSkillBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.skillsWrap}>
                {skills.map(skill => (
                  <TouchableOpacity key={skill} style={styles.skillTag} onPress={() => removeSkill(skill)} activeOpacity={0.7}>
                    <Text style={styles.skillTagText}>{skill}</Text>
                    <X color={colors.primaryLight} size={12} />
                  </TouchableOpacity>
                ))}
                {skills.length === 0 && (
                  <Text style={styles.emptyHint}>Add skills like JavaScript, Python, Project Management...</Text>
                )}
              </View>
            </View>
          )}

          {/* Education Section */}
          {activeSection === 2 && (
            <View style={styles.section}>
              <SectionHeader icon={<GraduationCap color={colors.primaryLight} size={22} />} title="Education" subtitle="Your academic background" />
              {education.map((edu, i) => (
                <SectionCard key={edu.id} label={`Education ${i + 1}`} onRemove={() => removeEducation(edu.id)}>
                  <InputField label="Institution" value={edu.institution} onChangeText={v => updateEducation(edu.id, 'institution', v)} placeholder="University name" icon={<Building color={colors.textMuted} size={16} />} />
                  <View style={styles.rowFields}>
                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                      <InputField label="Degree" value={edu.degree} onChangeText={v => updateEducation(edu.id, 'degree', v)} placeholder="Bachelor's, Master's" />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <InputField label="Field of Study" value={edu.field} onChangeText={v => updateEducation(edu.id, 'field', v)} placeholder="Computer Science" />
                    </View>
                  </View>
                  <View style={styles.rowFields}>
                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                      <InputField label="Start Year" value={edu.start_year} onChangeText={v => updateEducation(edu.id, 'start_year', v)} placeholder="2018" keyboardType="numeric" icon={<Calendar color={colors.textMuted} size={16} />} />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <InputField label="End Year" value={edu.end_year} onChangeText={v => updateEducation(edu.id, 'end_year', v)} placeholder="2022" keyboardType="numeric" icon={<Calendar color={colors.textMuted} size={16} />} />
                    </View>
                  </View>
                  <TextAreaField label="Highlights" value={edu.description} onChangeText={v => updateEducation(edu.id, 'description', v)} placeholder="Key achievements, activities, GPA..." />
                </SectionCard>
              ))}
              <AddButton label="Add Education" onPress={addEducation} />
            </View>
          )}

          {/* Work Experience Section */}
          {activeSection === 3 && (
            <View style={styles.section}>
              <SectionHeader icon={<Briefcase color={colors.primaryLight} size={22} />} title="Work Experience" subtitle="Your professional history" />
              {workExp.map((exp, i) => (
                <SectionCard key={exp.id} label={`Experience ${i + 1}`} onRemove={() => removeWorkExp(exp.id)}>
                  <InputField label="Company" value={exp.company} onChangeText={v => updateWorkExp(exp.id, 'company', v)} placeholder="Company name" icon={<Building color={colors.textMuted} size={16} />} />
                  <InputField label="Position" value={exp.position} onChangeText={v => updateWorkExp(exp.id, 'position', v)} placeholder="Job title" icon={<Briefcase color={colors.textMuted} size={16} />} />
                  <View style={styles.rowFields}>
                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                      <InputField label="Start Date" value={exp.start_date} onChangeText={v => updateWorkExp(exp.id, 'start_date', v)} placeholder="Jan 2020" icon={<Calendar color={colors.textMuted} size={16} />} />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <InputField label="End Date" value={exp.end_date} onChangeText={v => updateWorkExp(exp.id, 'end_date', v)} placeholder={exp.current ? 'Present' : 'Dec 2023'} icon={<Calendar color={colors.textMuted} size={16} />} />
                    </View>
                  </View>
                  <TouchableOpacity style={styles.checkboxRow} onPress={() => updateWorkExp(exp.id, 'current', !exp.current)}>
                    <View style={[styles.checkbox, exp.current && styles.checkboxActive]}>
                      {exp.current && <Check color={colors.white} size={12} />}
                    </View>
                    <Text style={styles.checkboxLabel}>Currently working here</Text>
                  </TouchableOpacity>
                  <TextAreaField label="Responsibilities & Achievements" value={exp.description} onChangeText={v => updateWorkExp(exp.id, 'description', v)} placeholder="Describe your role, projects, and key achievements..." />
                </SectionCard>
              ))}
              <AddButton label="Add Experience" onPress={addWorkExp} />
            </View>
          )}

          {/* References Section */}
          {activeSection === 5 && (
            <View style={styles.section}>
              <SectionHeader icon={<Users color={colors.primaryLight} size={22} />} title="References" subtitle="People who can vouch for you" />
              {references.map((ref, i) => (
                <SectionCard key={ref.id} label={`Reference ${i + 1}`} onRemove={() => removeReference(ref.id)}>
                  <InputField label="Full Name" value={ref.name} onChangeText={v => updateReference(ref.id, 'name', v)} placeholder="Jane Smith" icon={<User color={colors.textMuted} size={16} />} />
                  <View style={styles.rowFields}>
                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                      <InputField label="Position" value={ref.position} onChangeText={v => updateReference(ref.id, 'position', v)} placeholder="Senior Manager" />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <InputField label="Company" value={ref.company} onChangeText={v => updateReference(ref.id, 'company', v)} placeholder="Acme Corp" />
                    </View>
                  </View>
                  <InputField label="Email" value={ref.email} onChangeText={v => updateReference(ref.id, 'email', v)} placeholder="jane@example.com" keyboardType="email-address" icon={<Mail color={colors.textMuted} size={16} />} />
                  <InputField label="Phone" value={ref.phone} onChangeText={v => updateReference(ref.id, 'phone', v)} placeholder="+1 (555) 000-0000" keyboardType="phone-pad" icon={<Phone color={colors.textMuted} size={16} />} />
                </SectionCard>
              ))}
              <AddButton label="Add Reference" onPress={addReference} />
            </View>
          )}

          {/* Template Section */}
          {activeSection === 6 && (
            <View style={styles.section}>
              <SectionHeader icon={<Layers color={colors.primaryLight} size={22} />} title="Premium Templates" subtitle="Choose your CV style" />
              <View style={styles.templatesGrid}>
                {CV_TEMPLATES.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.templateCard, templateId === t.id && styles.templateCardActive, t.isPremium && styles.templateCardPremium]}
                    onPress={() => handleSelectTemplate(t)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.templatePreview, { borderColor: t.gradient[0] }]}>
                      {/* Preview button overlay */}
                      <TouchableOpacity
                        style={styles.previewIconBtn}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          setPreviewTemplateId(t.id);
                          setShowPreview(true);
                        }}
                      >
                        <Eye color={colors.white} size={14} />
                      </TouchableOpacity>
                      {templateId === t.id && (
                        <View style={[styles.templateCheckBg, { backgroundColor: t.gradient[0] }]}>
                          <Check color={colors.white} size={14} />
                        </View>
                      )}
                      {t.isPremium && templateId !== t.id && (
                        <View style={styles.premiumBadge}>
                          <Crown color={colors.white} size={12} />
                        </View>
                      )}
                      <FileText color={t.gradient[0]} size={24} />
                    </View>
                    <View style={styles.templateInfo}>
                      <View style={styles.templateNameRow}>
                        <Text style={[styles.templateName, templateId === t.id && { color: t.gradient[0] }]}>{t.name}</Text>
                        {t.isPremium && <Lock color={colors.warning} size={12} />}
                      </View>
                      <Text style={styles.templateDesc}>{t.description}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.heartBtn}
                      onPress={(e) => toggleFavorite(t.id, e)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Heart
                        size={18}
                        color={favoriteTemplates.has(t.id) ? '#EF4444' : colors.textMuted}
                        fill={favoriteTemplates.has(t.id) ? '#EF4444' : 'transparent'}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.saveSection}>
                <Text style={styles.saveSectionTitle}>Ready to save?</Text>
                <Text style={styles.saveSectionDesc}>Your CV will be saved with the {CV_TEMPLATES.find(t => t.id === templateId)?.name} template.</Text>

                <TouchableOpacity style={styles.saveFinalBtn} onPress={saveCV} disabled={saving}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveFinalGradient}
                  >
                    {saving ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <>
                        <Save color={colors.white} size={18} />
                        <Text style={styles.saveFinalText}>Save CV</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.navFooter}>
          <TouchableOpacity
            style={[styles.navBtn, activeSection === 0 && styles.navBtnHidden]}
            onPress={prevSection}
            disabled={activeSection === 0}
          >
            <ChevronLeft color={activeSection === 0 ? colors.textMuted : colors.primaryLight} size={20} />
            <Text style={[styles.navBtnText, activeSection === 0 && { color: colors.textMuted }]}>Previous</Text>
          </TouchableOpacity>
          <View style={styles.navSteps}>
            <Text style={styles.navStepCurrent}>{activeSection + 1}</Text>
            <Text style={styles.navStepTotal}>/ {SECTIONS.length}</Text>
          </View>
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnPrimary, activeSection === SECTIONS.length - 1 && styles.navBtnHidden]}
            onPress={nextSection}
            disabled={activeSection === SECTIONS.length - 1}
          >
            <Text style={[styles.navBtnText, { color: colors.white }]}>Next</Text>
            <ChevronRight color={colors.white} size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <RewardedAdModal
        visible={showRewardedAd}
        onClose={() => setShowRewardedAd(false)}
        onRewardEarned={handleRewardEarned}
        rewardType={pendingAction === 'pdf' ? 'pdf_download' : pendingAction === 'template' ? 'premium_template' : 'ai_generation'}
      />

      {/* Template Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={cancelTemplatePreview}
      >
        <SafeAreaView style={styles.previewModalContainer} edges={['top']}>
          <View style={styles.previewHeader}>
            <TouchableOpacity style={styles.previewCloseBtn} onPress={cancelTemplatePreview}>
              <X color={colors.text} size={22} />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>
              Preview: {CV_TEMPLATES.find(t => t.id === previewTemplateId)?.name || 'Template'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewContent}>
            {/* CV Preview */}
            <View style={styles.previewFrame}>
              <CVTemplatePreview
                templateId={previewTemplateId || 'classic'}
                fullName={fullName}
                email={email}
                phone={phone}
                address={address}
                summary={summary}
                skills={skills}
                education={education}
                workExperience={workExp}
                references={references}
              />
            </View>
          </ScrollView>

          {/* Preview Actions */}
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.previewCancelBtn} onPress={cancelTemplatePreview}>
              <X color={colors.textSecondary} size={18} />
              <Text style={styles.previewCancelText}>Choose Another</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.previewConfirmBtn} onPress={confirmTemplateSelection}>
              <Check color={colors.white} size={18} />
              <Text style={styles.previewConfirmText}>Use This Template</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// CV Template Preview Component
function CVTemplatePreview({
  templateId,
  fullName,
  email,
  phone,
  address,
  summary,
  skills,
  education,
  workExperience,
  references,
}: {
  templateId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  summary: string;
  skills: string[];
  education: EducationEntry[];
  workExperience: WorkExperienceEntry[];
  references: ReferenceEntry[];
}) {
  const template = CV_TEMPLATES.find(t => t.id === templateId) || CV_TEMPLATES[0];
  const [c1, c2] = template.gradient;

  const hasContent = fullName || email || skills.length > 0 || workExperience.length > 0;

  if (!hasContent) {
    return (
      <View style={previewStyles.emptyPreview}>
        <FileText color={c1} size={48} />
        <Text style={previewStyles.emptyTitle}>No Data Yet</Text>
        <Text style={previewStyles.emptyText}>Fill in your details to see a preview</Text>
      </View>
    );
  }

  return (
    <View style={previewStyles.container}>
      {/* Header */}
      <View style={[previewStyles.header, { backgroundColor: c1 }]}>
        <Text style={previewStyles.name}>{fullName || 'Your Name'}</Text>
        <View style={previewStyles.contacts}>
          {email && <Text style={previewStyles.contact}>{email}</Text>}
          {phone && <Text style={previewStyles.contact}>{phone}</Text>}
          {address && <Text style={previewStyles.contact}>{address}</Text>}
        </View>
      </View>

      {/* Content */}
      <View style={previewStyles.content}>
        {/* Summary */}
        {summary && (
          <View style={previewStyles.section}>
            <Text style={[previewStyles.sectionTitle, { color: c1 }]}>Professional Summary</Text>
            <Text style={previewStyles.summaryText}>{summary}</Text>
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={previewStyles.section}>
            <Text style={[previewStyles.sectionTitle, { color: c1 }]}>Skills</Text>
            <View style={previewStyles.skillsWrap}>
              {skills.slice(0, 8).map((skill, i) => (
                <View key={i} style={[previewStyles.skillTag, { backgroundColor: c1 + '15', borderColor: c1 + '40' }]}>
                  <Text style={[previewStyles.skillText, { color: c1 }]}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Work Experience */}
        {workExperience.length > 0 && (
          <View style={previewStyles.section}>
            <Text style={[previewStyles.sectionTitle, { color: c1 }]}>Experience</Text>
            {workExperience.slice(0, 3).map((exp, i) => (
              <View key={exp.id || i} style={previewStyles.item}>
                <View style={previewStyles.itemHeader}>
                  <Text style={previewStyles.itemTitle}>{exp.position || 'Position'}</Text>
                  <Text style={previewStyles.itemDate}>{exp.start_date || ''} - {exp.current ? 'Present' : exp.end_date || ''}</Text>
                </View>
                <Text style={previewStyles.itemSub}>{exp.company || ''}</Text>
                {exp.description && (
                  <Text style={previewStyles.itemDesc} numberOfLines={2}>{exp.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View style={previewStyles.section}>
            <Text style={[previewStyles.sectionTitle, { color: c1 }]}>Education</Text>
            {education.slice(0, 2).map((edu, i) => (
              <View key={edu.id || i} style={previewStyles.item}>
                <View style={previewStyles.itemHeader}>
                  <Text style={previewStyles.itemTitle}>{edu.degree || 'Degree'}</Text>
                  <Text style={previewStyles.itemDate}>{edu.start_year || ''} - {edu.end_year || ''}</Text>
                </View>
                <Text style={previewStyles.itemSub}>{edu.institution || ''}</Text>
                {edu.field && <Text style={previewStyles.itemDesc}>{edu.field}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* References */}
        {references.length > 0 && (
          <View style={previewStyles.section}>
            <Text style={[previewStyles.sectionTitle, { color: c1 }]}>References</Text>
            {references.slice(0, 2).map((ref, i) => (
              <View key={ref.id || i} style={previewStyles.refItem}>
                <Text style={previewStyles.refName}>{ref.name || 'Reference'}</Text>
                <Text style={previewStyles.refRole}>{ref.position || ''} {ref.company ? `at ${ref.company}` : ''}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 400,
  },
  emptyPreview: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  header: {
    padding: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 8,
  },
  contacts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contact: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  summaryText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  item: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  itemDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  itemSub: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  refItem: {
    marginBottom: 8,
  },
  refName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  refRole: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <View style={sHeaderStyles.container}>
      <View style={sHeaderStyles.iconBg}>{icon}</View>
      <View>
        <Text style={sHeaderStyles.title}>{title}</Text>
        {subtitle && <Text style={sHeaderStyles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const sHeaderStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

function InputField({ label, value, onChangeText, placeholder, keyboardType, icon, autoCapitalize }: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  icon?: React.ReactNode;
  autoCapitalize?: any;
}) {
  return (
    <View style={inputStyles.group}>
      <Text style={inputStyles.label}>{label}</Text>
      <View style={inputStyles.wrapper}>
        {icon && <View style={inputStyles.icon}>{icon}</View>}
        <TextInput
          style={[inputStyles.input, icon && inputStyles.inputWithIcon]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || 'sentences'}
          selectionColor={colors.primary}
        />
      </View>
    </View>
  );
}

const inputStyles = StyleSheet.create({
  group: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    height: 50,
    paddingHorizontal: spacing.md,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    height: '100%',
  },
  inputWithIcon: {
    marginLeft: 0,
  },
});

function TextAreaField({ label, value, onChangeText, placeholder, hint }: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <View style={textAreaStyles.group}>
      <Text style={textAreaStyles.label}>{label}</Text>
      <TextInput
        style={textAreaStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        selectionColor={colors.primary}
      />
      {hint && <Text style={textAreaStyles.hint}>{hint}</Text>}
    </View>
  );
}

const textAreaStyles = StyleSheet.create({
  group: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    minHeight: 120,
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

function SectionCard({ label, onRemove, children }: { label: string; onRemove: () => void; children: React.ReactNode }) {
  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.header}>
        <Text style={cardStyles.label}>{label}</Text>
        <View style={cardStyles.actions}>
          <TouchableOpacity onPress={onRemove} style={cardStyles.removeBtn}>
            <Trash2 color={colors.error} size={16} />
          </TouchableOpacity>
        </View>
      </View>
      {children}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  removeBtn: {
    padding: spacing.xs,
  },
});

function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={addStyles.btn} onPress={onPress}>
      <Plus color={colors.primaryLight} size={18} />
      <Text style={addStyles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const addStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryLight,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  titleInput: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    padding: 0,
    minWidth: 150,
  },
  autoSaveText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryGlow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  // Completion meter
  completionBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  completionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  completionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  completionPct: {
    fontSize: 13,
    fontWeight: '700',
  },
  completionTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  completionFill: {
    height: '100%',
    borderRadius: 3,
  },
  completionDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  completionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  completionDotDone: {
    backgroundColor: colors.primaryGlow,
  },
  completionDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  // Heart button
  heartBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  tabs: {
    maxHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primaryGlow,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primaryLight,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  formGroup: {
    marginTop: spacing.sm,
  },
  aiBtn: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  aiBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  aiBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  skillInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  skillInput: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 50,
    fontSize: 15,
    color: colors.text,
  },
  addSkillBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSkillBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryGlow,
    borderRadius: radius.full,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skillTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  emptyHint: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  rowFields: {
    flexDirection: 'row',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  templatesGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  templateCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  templateCardPremium: {
    borderStyle: 'dashed',
  },
  templatePreview: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  previewIconBtn: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  templateCheckBg: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateInfo: {
    flex: 1,
  },
  templateNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  templateDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  saveSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  saveSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  saveSectionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  saveFinalBtn: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    width: '100%',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveFinalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  saveFinalText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  navFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    minWidth: 90,
  },
  navBtnHidden: {
    opacity: 0.4,
  },
  navBtnPrimary: {
    backgroundColor: colors.primary,
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  navSteps: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  navStepCurrent: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  navStepTotal: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  // Preview Modal Styles
  previewModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  previewCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  previewScroll: {
    flex: 1,
  },
  previewContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  previewFrame: {
    width: '100%',
    maxWidth: 500,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  previewCancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  previewConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  previewConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
});
