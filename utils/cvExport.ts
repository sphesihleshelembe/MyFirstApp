import { Platform, Alert, ToastAndroid } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { CV } from '@/lib/supabase';
import { CVTemplate, CV_TEMPLATES } from '@/lib/templates';
import { generatePDFHtml, triggerPDFDownload } from '@/lib/pdf-generator';

export const downloadCVAsPDF = async (cv: CV, template?: CVTemplate) => {
  try {
    const t =
      template ||
      CV_TEMPLATES.find(tp => tp.id === cv.template_id) ||
      CV_TEMPLATES[0];

    const html = generatePDFHtml(cv, t);

    // Web download
    if (Platform.OS === 'web') {
      await triggerPDFDownload(
        html,
        `${cv.full_name || 'CV'}_Resume.pdf`
      );
      return;
    }

    // Generate PDF
    const Print = await import('expo-print');
    const { uri } = await Print.printToFileAsync({ html });

    // Ask user where to save
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (!permissions.granted) {
      Alert.alert(
        'Download Cancelled',
        'No folder was selected.'
      );
      return;
    }

    // Read generated PDF
    const pdfBase64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Create file in selected folder
    const fileUri =
      await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        `${cv.full_name || 'CV'}_Resume.pdf`,
        'application/pdf'
      );

    // Write PDF data
    await FileSystem.writeAsStringAsync(fileUri, pdfBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Success message
    if (Platform.OS === 'android') {
      ToastAndroid.show(
        'CV saved successfully',
        ToastAndroid.LONG
      );
    } else {
      Alert.alert(
        'Download Complete',
        'Your CV has been saved successfully.'
      );
    }
  } catch (error) {
    console.error('PDF download error:', error);

    Alert.alert(
      'Download Failed',
      'Unable to save the CV. Please try again.'
    );
  }
};