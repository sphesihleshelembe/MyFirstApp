import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export async function savePdf(
  pdfPath: string,
  fileName: string
) {
  try {
    if (Platform.OS === "android") {
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permissions.granted) {
        return false;
      }

      const pdfContent = await FileSystem.readAsStringAsync(pdfPath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const destinationUri =
        await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          "application/pdf"
        );

      await FileSystem.writeAsStringAsync(destinationUri, pdfContent, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return true;
    }

    // iOS
    if (!(await Sharing.isAvailableAsync())) {
      return false;
    }

    await Sharing.shareAsync(pdfPath, {
      mimeType: "application/pdf",
      dialogTitle: "Save CV",
      UTI: "com.adobe.pdf",
    });

    return true;
  } catch (error) {
    console.error("PDF export failed:", error);
    return false;
  }
}