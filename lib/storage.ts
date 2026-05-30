import AsyncStorage from '@react-native-async-storage/async-storage';
import { CV, EducationEntry, WorkExperienceEntry, ReferenceEntry } from './supabase';

const STORAGE_KEYS = {
  DRAFT_CV: 'draft_cv',
  AUTO_SAVED_CVS: 'auto_saved_cvs',
  LAST_SAVE_TIME: 'last_save_time',
};

export interface DraftCV {
  id: string;
  title: string;
  template_id: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  summary: string;
  skills: string[];
  education: EducationEntry[];
  work_experience: WorkExperienceEntry[];
  references_data: ReferenceEntry[];
  updated_at: string;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export async function saveDraftCV(draft: Partial<DraftCV>): Promise<string> {
  const existingDraft = await getDraftCV();
  const draftData: DraftCV = {
    id: existingDraft?.id || generateId(),
    title: draft.title || existingDraft?.title || 'My Professional CV',
    template_id: draft.template_id || existingDraft?.template_id || 'classic',
    full_name: draft.full_name || existingDraft?.full_name || '',
    phone: draft.phone || existingDraft?.phone || '',
    email: draft.email || existingDraft?.email || '',
    address: draft.address || existingDraft?.address || '',
    summary: draft.summary || existingDraft?.summary || '',
    skills: draft.skills || existingDraft?.skills || [],
    education: draft.education || existingDraft?.education || [],
    work_experience: draft.work_experience || existingDraft?.work_experience || [],
    references_data: draft.references_data || existingDraft?.references_data || [],
    updated_at: new Date().toISOString(),
  };

  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DRAFT_CV, JSON.stringify(draftData));
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SAVE_TIME, new Date().toISOString());
    return draftData.id;
  } catch (error) {
    console.error('Failed to save draft:', error);
    throw error;
  }
}

export async function getDraftCV(): Promise<DraftCV | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DRAFT_CV);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get draft:', error);
    return null;
  }
}

export async function clearDraftCV(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.DRAFT_CV);
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SAVE_TIME);
  } catch (error) {
    console.error('Failed to clear draft:', error);
  }
}

export async function getLastSaveTime(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SAVE_TIME);
  } catch {
    return null;
  }
}

export async function addAutoSavedCV(cv: CV): Promise<void> {
  try {
    const existing = await getAutoSavedCVs();
    const updated = [cv, ...existing.filter(c => c.id !== cv.id)].slice(0, 10);
    await AsyncStorage.setItem(STORAGE_KEYS.AUTO_SAVED_CVS, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to add auto-saved CV:', error);
  }
}

export async function getAutoSavedCVs(): Promise<CV[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.AUTO_SAVED_CVS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function convertDraftToCV(draft: DraftCV, userId: string): Omit<CV, 'created_at'> {
  return {
    id: draft.id,
    user_id: userId,
    title: draft.title,
    template_id: draft.template_id,
    full_name: draft.full_name,
    phone: draft.phone,
    email: draft.email,
    address: draft.address,
    summary: draft.summary,
    skills: draft.skills,
    education: draft.education,
    work_experience: draft.work_experience,
    references_data: draft.references_data,
    updated_at: draft.updated_at,
  };
}

export function convertCVToDraft(cv: CV): DraftCV {
  return {
    id: cv.id,
    title: cv.title,
    template_id: cv.template_id,
    full_name: cv.full_name,
    phone: cv.phone,
    email: cv.email,
    address: cv.address,
    summary: cv.summary,
    skills: cv.skills,
    education: cv.education,
    work_experience: cv.work_experience,
    references_data: cv.references_data,
    updated_at: cv.updated_at,
  };
}
