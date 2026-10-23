import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

async function copyIntoAppDocuments(uri: string): Promise<string> {
  // Web uses blob/object URLs and should keep the picker result as-is.
  if (!uri.startsWith('file://')) return uri;
  const directory = new Directory(Paths.document, 'rollcore-images');
  if (!directory.exists) directory.create({ idempotent: true, intermediates: true });
  const source = new File(uri);
  const extension = source.extension || '.jpg';
  const destination = new File(directory, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`);
  await source.copy(destination);
  return destination.uri;
}

export async function pickLocalImage(aspect: [number, number] = [1, 1]): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Acesso às fotos necessário', 'Permita o acesso à galeria nas configurações do dispositivo para escolher uma imagem.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.82,
  });
  if (result.canceled) return null;
  const uri = result.assets[0]?.uri;
  if (!uri) return null;
  try {
    return await copyIntoAppDocuments(uri);
  } catch (error) {
    console.warn('Não foi possível copiar a imagem para o armazenamento do app; mantendo a URI da galeria.', error);
    return uri;
  }
}
