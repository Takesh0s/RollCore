import { useAcessibilidade } from '../store/acessibilidade';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Modal, Pressable as NativePressable, ScrollView, Text as NativeText, TextInput as NativeTextInput, View } from 'react-native';
import { AccessibleText as Text, AccessibleTextInput as TextInput, AccessiblePressable as Pressable } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AUTH_COLORS, useAppFonts, appFontSize } from '../design/shared';
import { atualizarApelido, atualizarFotoPerfil, encerrarSessao, useContaAtiva } from '../store/conta';
import { pickLocalImage } from '../utils/imagePicker';

export default function PerfilScreen() {
  useAcessibilidade();
  const router = useRouter();
  const fontsLoaded = useAppFonts();
  const conta = useContaAtiva();
  const [editOpen, setEditOpen] = useState(false);
  const [apelido, setApelido] = useState(conta?.apelido ?? '');

  if (!fontsLoaded) return null;

  const sair = async () => {
    await encerrarSessao();
    router.replace('/login');
  };

  const salvarApelido = () => {
    const valor = apelido.trim();
    if (!/^[\p{L}\p{N}_]{3,20}$/u.test(valor)) {
      Alert.alert('Apelido inválido', 'Use de 3 a 20 caracteres: letras, números ou _.');
      return;
    }
    atualizarApelido(valor);
    setEditOpen(false);
  };

  const escolherFoto = async () => {
    try {
      const uri = await pickLocalImage([1, 1]);
      if (uri) atualizarFotoPerfil(uri);
    } catch {
      Alert.alert('Foto indisponível', 'Não foi possível abrir a galeria. Confira as permissões do aparelho e tente novamente.');
    }
  };

  const abrirOpcoesFoto = () => {
    if (!conta) {
      Alert.alert('Entre na sua conta', 'A foto será associada ao perfil depois que você entrar ou criar uma conta.');
      return;
    }
    Alert.alert('Foto de perfil', 'Escolha uma ação para sua foto.', [
      { text: conta?.fotoUri ? 'Trocar foto' : 'Escolher foto', onPress: () => { void escolherFoto(); } },
      ...(conta?.fotoUri ? [{ text: 'Remover foto', style: 'destructive' as const, onPress: () => atualizarFotoPerfil(undefined) }] : []),
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AUTH_COLORS.canvas }}>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Voltar" style={{ width: 42, height: 42, justifyContent: 'center' }}>
          <MaterialIcons name="arrow-back" size={26} color={AUTH_COLORS.white} />
        </Pressable>
        <Text style={{ color: AUTH_COLORS.mint, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(20) }}>Perfil</Text>
        <Pressable onPress={() => router.push('/configuracoes')} accessibilityLabel="Configurações" style={{ width: 42, alignItems: 'flex-end' }}>
          <MaterialIcons name="settings" size={21} color={AUTH_COLORS.white} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 24 }}>
        <View style={{ flex: 1, padding: 16, backgroundColor: AUTH_COLORS.profilePanel, borderWidth: 1, borderColor: AUTH_COLORS.gray }}>
          <View style={{ alignItems: 'center', paddingVertical: 18, gap: 5 }}>
            <Pressable onPress={abrirOpcoesFoto} accessibilityRole="button" accessibilityLabel={conta?.fotoUri ? 'Trocar ou remover foto de perfil' : 'Adicionar foto de perfil'} style={{ width: 92, height: 92, borderRadius: 46, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: AUTH_COLORS.mint, backgroundColor: AUTH_COLORS.panel }}>
              {conta?.fotoUri ? <Image source={{ uri: conta.fotoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <MaterialIcons name="person-outline" size={54} color={AUTH_COLORS.gray} />}
              <View style={{ position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderTopLeftRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: AUTH_COLORS.button }}><MaterialIcons name="photo-camera" size={16} color={AUTH_COLORS.mint} /></View>
            </Pressable>
            <Text style={{ color: AUTH_COLORS.gray, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(11) }}>Toque para adicionar ou trocar a foto</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: AUTH_COLORS.white, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(21) }}>{conta?.apelido ?? 'Aventureiro'}</Text>
              <Pressable onPress={() => { setApelido(conta?.apelido ?? ''); setEditOpen(true); }} accessibilityLabel="Editar apelido">
                <MaterialIcons name="edit" size={18} color={AUTH_COLORS.mint} />
              </Pressable>
            </View>
            <Text style={{ color: AUTH_COLORS.gray, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(12) }}>Aventureiro</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: AUTH_COLORS.gray }}>
            <MaterialIcons name="account-box" size={18} color={AUTH_COLORS.mint} />
            <Text style={{ color: AUTH_COLORS.mint, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(16) }}>Informações</Text>
          </View>

          <View style={{ paddingVertical: 11, gap: 9 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: AUTH_COLORS.gray, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(11) }}>Nome de usuário</Text>
                <Text style={{ color: AUTH_COLORS.white, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14) }}>{conta?.apelido ?? 'Não definido'}</Text>
              </View>
              <Pressable onPress={() => { setApelido(conta?.apelido ?? ''); setEditOpen(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <MaterialIcons name="edit" size={15} color={AUTH_COLORS.mint} /><Text style={{ color: AUTH_COLORS.mint, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(12) }}>Alterar</Text>
              </Pressable>
            </View>
            <View style={{ height: 1, backgroundColor: 'rgba(192,192,192,0.3)' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: AUTH_COLORS.gray, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(11) }}>E-mail</Text>
                <Text numberOfLines={1} style={{ color: AUTH_COLORS.white, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14) }}>{conta?.email ?? 'Nenhuma conta conectada'}</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: 12, borderTopWidth: 1, borderTopColor: AUTH_COLORS.gray }}>
            <Text style={{ color: AUTH_COLORS.gray, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(12) }}>Conexões</Text>
            <MaterialIcons name="g-translate" size={17} color={AUTH_COLORS.gray} />
            <Text style={{ color: AUTH_COLORS.gray, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(12) }}>Google não conectado</Text>
          </View>

          <View style={{ flex: 1, minHeight: 32 }} />
          {!conta ? (
            <Pressable onPress={() => router.replace('/login')} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: AUTH_COLORS.button }}>
              <Text style={{ color: AUTH_COLORS.mint, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>Entrar ou criar conta</Text>
            </Pressable>
          ) : (
            <Pressable onPress={sair} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: AUTH_COLORS.button }}>
              <Text style={{ color: AUTH_COLORS.mint, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>Logout</Text>
            </Pressable>
          )}
        </View>
        <Text style={{ paddingTop: 10, color: AUTH_COLORS.white, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(10), lineHeight: 14, textAlign: 'center' }}>
          Demonstração local: os dados ficam apenas na memória e não são enviados a um servidor.
        </Text>
      </ScrollView>

      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.65)' }}>
          <View style={{ padding: 18, gap: 14, backgroundColor: AUTH_COLORS.panel, borderWidth: 1, borderColor: AUTH_COLORS.gray }}>
            <Text style={{ color: AUTH_COLORS.mint, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(20) }}>Editar apelido</Text>
            <TextInput value={apelido} onChangeText={setApelido} maxLength={20} autoCapitalize="none" placeholder="Seu apelido" placeholderTextColor={AUTH_COLORS.placeholder} style={{ minHeight: 44, paddingHorizontal: 12, backgroundColor: AUTH_COLORS.field, color: AUTH_COLORS.white, fontFamily: 'AtkinsonHyperlegible_400Regular' }} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => setEditOpen(false)} style={{ flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: AUTH_COLORS.gray }}><Text style={{ color: AUTH_COLORS.white, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>Cancelar</Text></Pressable>
              <Pressable onPress={salvarApelido} style={{ flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: AUTH_COLORS.button }}><Text style={{ color: AUTH_COLORS.mint, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>Salvar</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
