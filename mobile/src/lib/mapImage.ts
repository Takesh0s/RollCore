import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { API_URL } from '../services/config';
import { request } from '../services/api';

const MAX_IMAGE_SIDE = 2400;
const MAX_IMAGE_BYTES = 1_900_000;

export interface PreparedImage { uri: string; width: number; height: number; mime: string }

/** URL para exibir: imagens enviadas voltam como `/images/{id}` no servidor da API. */
export function imageSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith('/images/') ? API_URL + url : url;
}

const sizeOf = async (uri: string) => (await (await fetch(uri)).blob()).size;

/**
 * Escolhe a imagem de fundo na galeria. O servidor aceita até 2 MB, então imagens grandes são reduzidas
 * (lado maior de 2400 px) e regravadas como JPEG com a qualidade que couber.
 * Devolve `null` se o usuário cancelar ou se a imagem não puder ser usada.
 */
export async function pickMapImage(): Promise<PreparedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Acesso às fotos necessário', 'Permita o acesso à galeria nas configurações do aparelho para escolher uma imagem.');
    return null;
  }
  const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (picked.canceled || !picked.assets[0]) return null;
  const a = picked.assets[0];
  const side = Math.max(a.width, a.height);
  const okType = !a.mimeType || /^image\/(png|jpeg|webp)$/.test(a.mimeType);
  if (!okType) return null;
  if (a.fileSize && a.fileSize <= MAX_IMAGE_BYTES && side <= MAX_IMAGE_SIDE) return { uri: a.uri, width: a.width, height: a.height, mime: a.mimeType ?? 'image/jpeg' };
  try {
    const scale = Math.min(1, MAX_IMAGE_SIDE / side);
    const w = Math.round(a.width * scale), h = Math.round(a.height * scale);
    for (const q of [0.9, 0.8, 0.7, 0.6, 0.5, 0.4]) {
      const out = await manipulateAsync(a.uri, scale < 1 ? [{ resize: { width: w, height: h } }] : [], { compress: q, format: SaveFormat.JPEG });
      if ((await sizeOf(out.uri)) <= MAX_IMAGE_BYTES) return { uri: out.uri, width: out.width, height: out.height, mime: 'image/jpeg' };
    }
  } catch {
    // cai no null abaixo
  }
  return null;
}

/** Envia a imagem para `POST /images`; devolve o caminho `/images/{id}` ou null se o envio falhar. */
export async function uploadImage(image: PreparedImage): Promise<string | null> {
  try {
    const form = new FormData();
    if (Platform.OS === 'web') form.append('file', await (await fetch(image.uri)).blob(), 'image');
    else form.append('file', { uri: image.uri, name: 'image', type: image.mime } as unknown as Blob);
    const data = await request<{ url: string }>('/images', { method: 'POST', body: form });
    return data.url;
  } catch {
    return null;
  }
}

/**
 * Escolhe uma foto na galeria, recortada na proporção `aspect` (largura / altura) e reduzida a `maxWidth` px,
 * como JPEG pronto para `uploadImage`. Devolve null se o usuário cancelar ou negar o acesso.
 */
export async function pickImage({ aspect, maxWidth }: { aspect: [number, number]; maxWidth: number }): Promise<PreparedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Acesso às fotos necessário', 'Permita o acesso à galeria nas configurações do aparelho para escolher uma imagem.');
    return null;
  }
  const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect, quality: 1 });
  if (picked.canceled || !picked.assets[0]) return null;
  const a = picked.assets[0];
  try {
    const out = await manipulateAsync(a.uri, a.width > maxWidth ? [{ resize: { width: maxWidth } }] : [], { compress: 0.85, format: SaveFormat.JPEG });
    return { uri: out.uri, width: out.width, height: out.height, mime: 'image/jpeg' };
  } catch {
    return null;
  }
}

/**
 * Foto do perfil: recorte quadrado reduzido a 256 px e gravado como JPEG em data URL,
 * o mesmo formato que o web guarda em `avatarUrl`. Devolve `null` se o usuário cancelar.
 */
export async function pickAvatarDataUrl(): Promise<string | null> {
  const img = await pickImage({ aspect: [1, 1], maxWidth: 256 });
  if (!img) return null;
  try {
    const out = await manipulateAsync(img.uri, [], { compress: 0.8, format: SaveFormat.JPEG, base64: true });
    return out.base64 ? `data:image/jpeg;base64,${out.base64}` : null;
  } catch {
    return null;
  }
}
