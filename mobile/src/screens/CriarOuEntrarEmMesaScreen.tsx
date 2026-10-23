import { useAcessibilidade } from '../store/acessibilidade';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable as NativePressable, ScrollView, Text as NativeText, TextInput as NativeTextInput, View } from 'react-native';
import { AccessibleText as Text, AccessibleTextInput as TextInput, AccessiblePressable as Pressable } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Field, Header, PrimaryButton, useAppFonts, appFontSize } from '../design/shared';
import { addMesa, getMesaById, entrarPorCodigo, updateMesa } from '../store/mesas';
import { pickLocalImage } from '../utils/imagePicker';

const SISTEMAS = ['D&D 5e', 'Tormenta20', 'Call of Cthulhu', 'Pathfinder 2e', 'Outro'];

function SystemPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14), paddingLeft: 4 }}>Sistema de RPG</Text>
      <Pressable onPress={() => setOpen((current) => !current)} style={{ minHeight: 48, backgroundColor: COLORS.surfaceContainerLowest, borderWidth: 2, borderColor: open ? COLORS.primary : COLORS.outlineVariant, borderRadius: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: value ? COLORS.onSurface : COLORS.outline, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(16) }}>{value || 'Selecione um sistema...'}</Text>
        <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={22} color={COLORS.onSurfaceVariant} />
      </Pressable>
      {open && <View style={{ backgroundColor: COLORS.surfaceContainerHigh, borderRadius: 8, borderWidth: 1, borderColor: COLORS.outlineVariant, overflow: 'hidden' }}>
        {SISTEMAS.map((sistema) => <Pressable key={sistema} onPress={() => { onChange(sistema); setOpen(false); }} style={{ paddingHorizontal: 16, paddingVertical: 12 }}><Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(15) }}>{sistema}</Text></Pressable>)}
      </View>}
    </View>
  );
}

export default function CriarOuEntrarEmMesaScreen() {
  useAcessibilidade();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = typeof params.id === 'string' ? params.id : undefined;
  const existing = editId ? getMesaById(editId) : undefined;
  const editing = !!existing;
  const fontsLoaded = useAppFonts();
  const [tab, setTab] = useState<'criar' | 'entrar'>(editing ? 'criar' : 'criar');
  const [nome, setNome] = useState(existing?.titulo ?? '');
  const [sistema, setSistema] = useState(existing?.sistema ?? '');
  const [descricao, setDescricao] = useState(existing?.descricao ?? '');
  const [codigo, setCodigo] = useState('');
  const [imagemUri, setImagemUri] = useState(existing?.imagemUri);

  if (!fontsLoaded) return null;

  const escolherCapa = async () => {
    try {
      const uri = await pickLocalImage([16, 9]);
      if (uri) setImagemUri(uri);
    } catch {
      Alert.alert('Não foi possível abrir as fotos', 'Tente novamente ou confira as permissões do dispositivo.');
    }
  };

  const handleCriar = () => {
    const titulo = nome.trim();
    if (titulo.length < 2) {
      Alert.alert('Nome da mesa', 'Informe pelo menos 2 caracteres para o nome da campanha.');
      return;
    }
    if (editing && existing) updateMesa(existing.id, { titulo, sistema: sistema.trim() || 'Sistema Livre', descricao: descricao.trim() || undefined, imagemUri });
    else addMesa({ titulo, sistema, descricao, imagemUri });
    router.replace('/mesas' as any);
  };

  const handleEntrar = () => {
    if (!codigo.trim()) {
      Alert.alert('Código de convite', 'Digite o código fornecido pelo mestre.');
      return;
    }
    entrarPorCodigo(codigo);
    router.replace('/mesas' as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title={editing ? 'Editar Mesa' : 'Mesa'} onBack={() => router.back()} />
      {!editing && <View style={{ flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0 }}>
        {([{ key: 'criar', title: 'Criar Mesa' }, { key: 'entrar', title: 'Entrar em Mesa' }] as const).map((item) => (
          <Pressable key={item.key} onPress={() => setTab(item.key)} style={{ flex: 1, minHeight: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: tab === item.key ? COLORS.primaryContainer : 'transparent' }}>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14), color: tab === item.key ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant }}>{item.title}</Text>
          </Pressable>
        ))}
      </View>}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 18, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {tab === 'criar' ? <>
            <Pressable onPress={escolherCapa} accessibilityLabel="Escolher capa da mesa pela galeria" style={{ height: 154, overflow: 'hidden', borderRadius: 12, backgroundColor: COLORS.surfaceContainerHighest, borderWidth: 1, borderColor: COLORS.outlineVariant, alignItems: 'center', justifyContent: 'center' }}>
              {imagemUri ? <Image source={{ uri: imagemUri }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" /> : <MaterialIcons name="add-photo-alternate" size={40} color={COLORS.primary} />}
              <View style={{ position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.primaryContainer, borderWidth: 1, borderColor: COLORS.primary }}>
                <MaterialIcons name="photo-library" size={17} color={COLORS.onPrimaryContainer} /><Text style={{ color: COLORS.onPrimaryContainer, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(12) }}>{imagemUri ? 'Trocar capa' : 'Escolher capa'}</Text>
              </View>
            </Pressable>
            <Field label="Nome da Mesa" placeholder="Ex.: A Batalha de Águas Profundas" value={nome} onChangeText={setNome} />
            <SystemPicker value={sistema} onChange={setSistema} />
            <View style={{ gap: 4 }}>
              <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14), paddingLeft: 4 }}>Descrição <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular' }}>(Opcional)</Text></Text>
              <TextInput value={descricao} onChangeText={setDescricao} placeholder="Uma breve descrição sobre a campanha..." placeholderTextColor={COLORS.outline} multiline numberOfLines={4} style={{ minHeight: 96, backgroundColor: COLORS.surfaceContainerLowest, borderWidth: 2, borderColor: COLORS.outlineVariant, borderRadius: 8, padding: 16, color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(15), textAlignVertical: 'top' }} />
            </View>
            <View style={{ flex: 1 }} />
            <PrimaryButton title={editing ? 'Salvar Alterações' : 'Criar Mesa'} icon={editing ? 'save' : 'edit-document'} onPress={handleCriar} />
          </> : <>
            <View style={{ alignItems: 'center', gap: 8, marginTop: 24 }}>
              <View style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: COLORS.outlineVariant, backgroundColor: COLORS.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' }}><MaterialIcons name="vpn-key" size={40} color={COLORS.onSurfaceVariant} /></View>
              <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(20), textAlign: 'center' }}>Possui um Código de Convite?</Text>
              <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14), textAlign: 'center', maxWidth: 280 }}>Insira o código fornecido pelo seu Mestre para registrar a mesa neste aparelho.</Text>
            </View>
            <Field label="Código de convite" placeholder="EX: AX7-99B" value={codigo} onChangeText={(value) => setCodigo(value.toUpperCase())} autoCapitalize="characters" />
            <View style={{ flex: 1 }} />
            <PrimaryButton title="Entrar na Mesa" icon="login" onPress={handleEntrar} />
            <Text style={{ color: COLORS.outline, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(11), textAlign: 'center' }}>Sem backend, o convite fica registrado apenas como uma mesa local de demonstração.</Text>
          </>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
