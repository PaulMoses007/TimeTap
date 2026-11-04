import { Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

/**
 * Copy text to the clipboard. Works in the app and in phone browsers.
 * Returns true if it was copied, false if the person has to copy it by hand.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    // fall through to the browser fallback
  }

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    // Older / stricter phone browsers: select a hidden field and use execCommand
    try {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.top = '0';
      field.style.left = '0';
      field.style.opacity = '0';
      field.style.fontSize = '16px'; // stops iOS zooming in
      document.body.appendChild(field);
      field.focus();
      field.select();
      field.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(field);
      if (ok) return true;
    } catch {
      // ignore, handled below
    }
  }

  return false;
}
