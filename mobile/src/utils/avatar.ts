import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

const MAX_SIDE = 256;

/**
 * Lets the user pick and crop (square) a photo and returns it as a small JPEG data URL (256 px), the format
 * the API stores with the sheet. Returns null when the user cancels or denies access.
 */
export async function pickAvatarDataUrl(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Acesso às fotos necessário', 'Permita o acesso à galeria nas configurações do aparelho para escolher uma foto.');
    return null;
  }
  const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
  if (picked.canceled || !picked.assets[0]) return null;
  const asset = picked.assets[0];
  const longest = Math.max(asset.width, asset.height);
  const actions = longest > MAX_SIDE ? [{ resize: asset.width >= asset.height ? { width: MAX_SIDE } : { height: MAX_SIDE } }] : [];
  const out = await manipulateAsync(asset.uri, actions, { compress: 0.85, format: SaveFormat.JPEG, base64: true });
  return out.base64 ? `data:image/jpeg;base64,${out.base64}` : null;
}
