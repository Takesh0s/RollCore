import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Tokens live in the OS keystore on Android/iOS (expo-secure-store). SecureStore
// does not exist on web, so the web build falls back to AsyncStorage (localStorage).
const ACCESS_KEY = 'rollcore.accessToken';
const REFRESH_KEY = 'rollcore.refreshToken';
const useSecureStore = Platform.OS !== 'web';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

async function read(key: string): Promise<string | null> {
  try {
    return useSecureStore ? await SecureStore.getItemAsync(key) : await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: string): Promise<void> {
  if (useSecureStore) await SecureStore.setItemAsync(key, value);
  else await AsyncStorage.setItem(key, value);
}

async function remove(key: string): Promise<void> {
  try {
    if (useSecureStore) await SecureStore.deleteItemAsync(key);
    else await AsyncStorage.removeItem(key);
  } catch {
    // nothing to remove / store unavailable
  }
}

export async function loadTokens(): Promise<TokenPair | null> {
  const [accessToken, refreshToken] = await Promise.all([read(ACCESS_KEY), read(REFRESH_KEY)]);
  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
}

export async function saveTokens(tokens: TokenPair): Promise<void> {
  await Promise.all([write(ACCESS_KEY, tokens.accessToken), write(REFRESH_KEY, tokens.refreshToken)]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([remove(ACCESS_KEY), remove(REFRESH_KEY)]);
}
