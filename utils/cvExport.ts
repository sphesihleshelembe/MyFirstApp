
import { CV } from '@/lib/supabase';
import { CVTemplate, CV_TEMPLATES } from '@/lib/templates';
import { generatePDFHtml, triggerPDFDownload } from '@/lib/pdf-generator';
import { Alert, Platform } from "react-native";
import { savePdf } from "@/services/export";

export const exportCVAsPDF = async (cv: CV, template?: CVTemplate) => {
  const t = template || CV_TEMPLATES.find(tp => tp.id === cv.template_id) || CV_TEMPLATES[0];
  const html = generatePDFHtml(cv, t);


  if (Platform.OS === 'web') {
    await triggerPDFDownload(html, `${cv.full_name || 'CV'}_Resume.pdf`);
    return;
  }

  // For native, fall back to expo-print + sharing
  const Print = await import('expo-print');
  const Sharing = await import("expo-sharing");
  const { uri } = await Print.printToFileAsync({ html });
  Alert.alert(
  "Export CV",
  "How would you like to export your CV?",
  [
    {
      text: "Save to Device",
      onPress: async () => {
        const success = await savePdf(
          uri,
         `${cv.full_name || "CV"} - CV.pdf`        );

       if (success) {
  Alert.alert(
    "Success",
    Platform.OS === "android"
      ? "PDF saved successfully."
      : "Choose 'Save to Files' from the share sheet to save your PDF."
  );
}
      },
    },
   {
  text: "Share PDF",
  onPress: async () => {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Share CV",
    });
  },
},
    {
      text: "Cancel",
      style: "cancel",
    },
  ]
);
};