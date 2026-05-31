export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  gradient: [string, string];
  previewBg: string;
  isPremium: boolean;

  style:
    | 'classic'
    | 'modern'
    | 'minimal'
    | 'executive'
    | 'creative'
    | 'professional'
    | 'tech'
    | 'elegant';

  // Layout system for PDF structure
  layout: 'single' | 'two-column' | 'sidebar';
}

export const CV_TEMPLATES: CVTemplate[] = [
  // ================= FREE TEMPLATES =================

  {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless and traditional',
    gradient: ['#2563EB', '#3B82F6'],
    previewBg: '#1E3A8A',
    isPremium: false,
    style: 'classic',
    layout: 'single',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary',
    gradient: ['#0891B2', '#06B6D4'],
    previewBg: '#164E63',
    isPremium: false,
    style: 'modern',
    layout: 'two-column',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant',
    gradient: ['#374151', '#6B7280'],
    previewBg: '#1F2937',
    isPremium: false,
    style: 'minimal',
    layout: 'single',
  },

  // ================= PREMIUM TEMPLATES =================

  {
    id: 'executive',
    name: 'Executive',
    description: 'Bold and high-impact professional layout',
    gradient: ['#1E3A5F', '#2563EB'],
    previewBg: '#0F172A',
    isPremium: true,
    style: 'executive',
    layout: 'sidebar',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Modern artistic layout with visual balance',
    gradient: ['#7C3AED', '#A855F7'],
    previewBg: '#4C1D95',
    isPremium: true,
    style: 'creative',
    layout: 'two-column',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Corporate-ready structured layout',
    gradient: ['#059669', '#10B981'],
    previewBg: '#064E3B',
    isPremium: true,
    style: 'professional',
    layout: 'single',
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Developer-focused modern tech CV',
    gradient: ['#DC2626', '#EF4444'],
    previewBg: '#7F1D1D',
    isPremium: true,
    style: 'tech',
    layout: 'sidebar',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated premium minimalist design',
    gradient: ['#B45309', '#D97706'],
    previewBg: '#78350F',
    isPremium: true,
    style: 'elegant',
    layout: 'single',
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): CVTemplate {
  return CV_TEMPLATES.find(t => t.id === id) || CV_TEMPLATES[0];
}

/**
 * Check if template is premium
 */
export function isPremiumTemplate(id: string): boolean {
  return getTemplateById(id).isPremium;
}

/**
 * Get templates by layout type
 */
export function getTemplatesByLayout(layout: CVTemplate['layout']): CVTemplate[] {
  return CV_TEMPLATES.filter(t => t.layout === layout);
}