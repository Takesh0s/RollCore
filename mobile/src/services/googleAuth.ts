import { Platform } from 'react-native';

// OAuth client ids (public values, safe to ship in the app). Expo inlines
// EXPO_PUBLIC_* variables at build time; see mobile/.env.example.
const read = (value?: string) => (value && value.trim().length > 0 ? value.trim() : undefined);

export const GOOGLE_WEB_CLIENT_ID = read(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
export const GOOGLE_ANDROID_CLIENT_ID = read(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID);

/** True when the current platform has the client id it needs for Google sign-in. */
export function googleConfiguradoNestaPlataforma(): boolean {
  if (Platform.OS === 'web') return Boolean(GOOGLE_WEB_CLIENT_ID);
  if (Platform.OS === 'android') return Boolean(GOOGLE_ANDROID_CLIENT_ID);
  return false;
}
