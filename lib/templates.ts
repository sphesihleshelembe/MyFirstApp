export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  gradient: [string, string];
  previewBg: string;
  isPremium: boolean;
  style: 'classic' | 'modern' | 'minimal' | 'executive' | 'creative' | 'professional' | 'tech' | 'elegant';
}

export const CV_TEMPLATES: CVTemplate[] = [
  // Free Templates
  {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless and traditional',
    gradient: ['#2563EB', '#3B82F6'],
    previewBg: '#1E3A8A',
    isPremium: false,
    style: 'classic',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary',
    gradient: ['#0891B2', '#06B6D4'],
    previewBg: '#164E63',
    isPremium: false,
    style: 'modern',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant',
    gradient: ['#374151', '#6B7280'],
    previewBg: '#1F2937',
    isPremium: false,
    style: 'minimal',
  },

  // Premium Templates
  {
    id: 'executive',
    name: 'Executive',
    description: 'Bold and professional',
    gradient: ['#1E3A5F', '#2563EB'],
    previewBg: '#0F172A',
    isPremium: true,
    style: 'executive',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Artistic and unique',
    gradient: ['#7C3AED', '#A855F7'],
    previewBg: '#4C1D95',
    isPremium: true,
    style: 'creative',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Corporate excellence',
    gradient: ['#059669', '#10B981'],
    previewBg: '#064E3B',
    isPremium: true,
    style: 'professional',
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Perfect for developers',
    gradient: ['#DC2626', '#EF4444'],
    previewBg: '#7F1D1D',
    isPremium: true,
    style: 'tech',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated design',
    gradient: ['#B45309', '#D97706'],
    previewBg: '#78350F',
    isPremium: true,
    style: 'elegant',
  },
];

export function getTemplateById(id: string): CVTemplate {
  return CV_TEMPLATES.find(t => t.id === id) || CV_TEMPLATES[0];
}

export function isPremiumTemplate(id: string): boolean {
  const template = getTemplateById(id);
  return template.isPremium;
}
