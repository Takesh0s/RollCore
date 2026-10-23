import { useAcessibilidade } from '../store/acessibilidade';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable as NativePressable, ScrollView, Text as NativeText, View } from 'react-native';
import { AccessibleText as Text, AccessiblePressable as Pressable } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Field, Header, PrimaryButton, useAppFonts, appFontSize } from '../design/shared';
import { ATRIBUTOS_BASE, getPersonagem, modificador, setPersonagem } from '../store/personagem';
import { pickLocalImage } from '../utils/imagePicker';

export default function CriarPersonagemScreen() {
  useAcessibilidade();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = typeof params.id === 'string' ? params.id : undefined;
  const existing = editId ? getPersonagem(editId) : undefined;
  const editing = !!existing && existing.id !== 'sem-personagem';
  const fontsLoaded = useAppFonts();

  const [nome, setNome] = useState(editing ? existing.nome : '');
  const [classe, setClasse] = useState(editing ? existing.classe : '');
  const [raca, setRaca] = useState(editing ? existing.raca ?? '' : '');
  const [nivel, setNivel] = useState(String(editing ? existing.nivel : 1));
  const [hp, setHp] = useState(String(editing ? existing.pontosVida ?? 10 : 10));
  const [ca, setCa] = useState(String(editing ? existing.classeArmadura ?? 10 : 10));
  const [imagemUri, setImagemUri] = useState(editing ? existing.imagemUri : undefined);
  const [valores, setValores] = useState<Record<string, number>>(
    editing ? existing.valores : ATRIBUTOS_BASE.reduce((acc, atributo) => ({ ...acc, [atributo.key]: 10 }), {} as Record<string, number>),
  );

  if (!fontsLoaded) return null;

  const ajustar = (key: string, delta: number) => {
    setValores((prev) => ({ ...prev, [key]: Math.max(1, Math.min(30, (prev[key] ?? 10) + delta)) }));
  };

  const escolherFoto = async () => {
    try {
      const uri = await pickLocalImage([1, 1]);
      if (uri) setImagemUri(uri);
    } catch {
      Alert.alert('Não foi possível abrir as fotos', 'Tente novamente ou confira as permissões do dispositivo.');
    }
  };

  const salvar = () => {
    const nomeLimpo = nome.trim();
    const nivelNum = Number(nivel);
    const hpNum = Number(hp);
    const caNum = Number(ca);
    if (nomeLimpo.length < 2) {
      Alert.alert('Nome obrigatório', 'Informe pelo menos 2 caracteres para o personagem.');
      return;
    }
    if (!Number.isInteger(nivelNum) || nivelNum < 1 || nivelNum > 20 || !Number.isInteger(hpNum) || hpNum < 1 || !Number.isInteger(caNum) || caNum < 0) {
      Alert.alert('Valores inválidos', 'Confira nível (1–20), pontos de vida e classe de armadura.');
      return;
    }
    const saved = setPersonagem({
      ...(editing ? { id: existing.id } : {}),
      nome: nomeLimpo,
      classe: classe.trim() || 'Aventureiro',
      raca: raca.trim() || undefined,
      nivel: nivelNum,
      pontosVida: hpNum,
      classeArmadura: caNum,
      imagemUri,
      valores,
    });
    router.replace(`/personagens?id=${saved.id}` as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title={editing ? 'Editar Personagem' : 'Novo Personagem'} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 18 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={escolherFoto} style={{ alignSelf: 'center', width: 116, height: 116, borderRadius: 58, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 2, borderColor: COLORS.primary }} accessibilityLabel="Escolher foto do personagem">
          {imagemUri ? <Image source={{ uri: imagemUri }} style={{ width: '100%', height: '100%' }} /> : <MaterialIcons name="add-a-photo" size={36} color={COLORS.primary} />}
          <View style={{ position: 'absolute', right: 2, bottom: 2, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryContainer, borderWidth: 1, borderColor: COLORS.primary }}><MaterialIcons name="edit" size={16} color={COLORS.onPrimaryContainer} /></View>
        </Pressable>
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(12), textAlign: 'center', marginTop: -10 }}>Toque para escolher uma foto do aparelho</Text>

        <Field label="Nome do Personagem" placeholder="Ex.: Valerius" value={nome} onChangeText={setNome} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Field label="Classe" placeholder="Paladino" value={classe} onChangeText={setClasse} /></View>
          <View style={{ flex: 1 }}><Field label="Raça" placeholder="Humano" value={raca} onChangeText={setRaca} /></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><Field label="Nível" value={nivel} onChangeText={setNivel} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Pontos de Vida" value={hp} onChangeText={setHp} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Field label="CA" value={ca} onChangeText={setCa} keyboardType="number-pad" /></View>
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>Atributos</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
            {ATRIBUTOS_BASE.map((atributo) => (
              <View key={atributo.key} style={{ width: '47%', backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 12, alignItems: 'center', gap: 8 }}>
                <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(11) }}>{atributo.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Pressable onPress={() => ajustar(atributo.key, -1)} accessibilityLabel={`Diminuir ${atributo.label}`} style={{ padding: 6 }}><MaterialIcons name="remove-circle-outline" size={22} color={COLORS.primary} /></Pressable>
                  <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(22), minWidth: 32, textAlign: 'center' }}>{valores[atributo.key] ?? 10}</Text>
                  <Pressable onPress={() => ajustar(atributo.key, 1)} accessibilityLabel={`Aumentar ${atributo.label}`} style={{ padding: 6 }}><MaterialIcons name="add-circle-outline" size={22} color={COLORS.primary} /></Pressable>
                </View>
                <Text style={{ color: COLORS.secondary, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(12) }}>Mod: {modificador(valores[atributo.key] ?? 10) >= 0 ? '+' : ''}{modificador(valores[atributo.key] ?? 10)}</Text>
              </View>
            ))}
          </View>
        </View>
        <PrimaryButton title={editing ? 'Salvar Alterações' : 'Criar Personagem'} icon="check-circle" onPress={salvar} />
      </ScrollView>
    </SafeAreaView>
  );
}
