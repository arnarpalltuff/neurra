import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { RefObject } from 'react';
import { View } from 'react-native';

/**
 * Capture a View as PNG and open the native share sheet.
 * Returns true if successfully shared, false if sharing unavailable or user cancelled.
 */
export async function captureAndShare(ref: RefObject<View | null>): Promise<boolean> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) return false;

    const uri = await captureRef(ref, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });

    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share your progress',
    });

    return true;
  } catch {
    return false;
  }
}
