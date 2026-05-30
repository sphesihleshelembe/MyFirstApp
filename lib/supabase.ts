import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type CV = {
  id: string;
  user_id: string;
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
  created_at: string;
  updated_at: string;
};

export type EducationEntry = {
  id: string;
  institution: string;
  degree: string;
  field: string;
  start_year: string;
  end_year: string;
  description: string;
};

export type WorkExperienceEntry = {
  id: string;
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  current: boolean;
  description: string;
};

export type ReferenceEntry = {
  id: string;
  name: string;
  position: string;
  company: string;
  email: string;
  phone: string;
};

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
};
