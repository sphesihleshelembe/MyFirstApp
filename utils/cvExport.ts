import { Platform } from 'react-native';
import { CV } from '@/lib/supabase';
import { CVTemplate, CV_TEMPLATES } from '@/lib/templates';
import { generatePDFHtml, triggerPDFDownload } from '@/lib/pdf-generator';

export const downloadCVAsPDF = async (cv: CV, template?: CVTemplate) => {
  const t = template || CV_TEMPLATES.find(tp => tp.id === cv.template_id) || CV_TEMPLATES[0];
  const html = generatePDFHtml(cv, t);

  if (Platform.OS === 'web') {
    await triggerPDFDownload(html, `${cv.full_name || 'CV'}_Resume.pdf`);
    return;
  }

  // For native, fall back to expo-print + sharing
  const Print = await import('expo-print');
  const Sharing = await import('expo-sharing');
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Download CV',
  });
};
