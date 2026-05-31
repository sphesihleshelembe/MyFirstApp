export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  gradient: [string, string];
  previewBg: string;
  isPremium: boolean;

  // existing style system
  style:
    | 'classic'
    | 'modern'
    | 'minimal'
    | 'executive'
    | 'creative'
    | 'professional'
    | 'tech'
    | 'elegant';

  // 🔥 NEW: layout system (THIS IS THE UPGRADE)
  layout: 'single' | 'two-column' | 'sidebar';
}