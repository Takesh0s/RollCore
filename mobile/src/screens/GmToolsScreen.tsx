import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable as NativePressable, ScrollView, Text as NativeText, TextInput as NativeTextInput, View } from 'react-native';
import { AccessibleText as Text, AccessibleTextInput as TextInput, AccessiblePressable as Pressable } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { COLORS, useAppFonts } from '../design/shared';
import { useAcessibilidade } from '../store/acessibilidade';
import { pickLocalImage } from '../utils/imagePicker';

type ToolId = 'maps' | 'npcs' | 'shops' | 'items' | 'monsters' | 'soundboard';
type FieldSpec = { key: string; label: string; placeholder: string; multiline?: boolean };
type Tool = { id: ToolId; title: string; typeLabel: string; icon: keyof typeof MaterialIcons.glyphMap; description: string; fields: FieldSpec[] };
type SavedAsset = { id: string; toolId: ToolId; typeLabel: string; name: string; description: string; fields: Record<string, string>; imageUri?: string; createdAt: number };

const STORAGE_KEY = '@rollcore/gm-assets-v1';
const TOOLS: Tool[] = [
  { id: 'maps', title: 'Lista de mapas', typeLabel: 'MAPA', icon: 'map', description: 'Organize locais, biomas e ganchos de exploração.', fields: [
    { key: 'local', label: 'Região / campanha', placeholder: 'Ex.: Ruínas de Valfenda' },
    { key: 'terreno', label: 'Terreno e clima', placeholder: 'Floresta, pântano, nevasca...' },
    { key: 'dimensoes', label: 'Dimensões / escala', placeholder: 'Ex.: 24 × 18 quadrados' },
    { key: 'pontos', label: 'Pontos de interesse e encontros', placeholder: 'Entradas, perigos, tesouros e encontros...', multiline: true },
  ] },
  { id: 'npcs', title: 'Criador de NPCs', typeLabel: 'NPC', icon: 'person-add', description: 'Crie personagens do mestre com identidade, motivação e segredos.', fields: [
    { key: 'raca', label: 'Raça / espécie', placeholder: 'Humana, elfo, anão...' },
    { key: 'papel', label: 'Papel na aventura', placeholder: 'Aliado, comerciante, rival, informante...' },
    { key: 'alinhamento', label: 'Alinhamento / atitude', placeholder: 'Leal e neutro, desconfiado...' },
    { key: 'personalidade', label: 'Personalidade e aparência', placeholder: 'Voz, aparência, maneirismos...', multiline: true },
    { key: 'objetivo', label: 'Objetivo / motivação', placeholder: 'O que esse NPC quer alcançar?' },
    { key: 'segredo', label: 'Segredo ou informação', placeholder: 'O que sabe ou esconde?', multiline: true },
  ] },
  { id: 'shops', title: 'Criador de lojas', typeLabel: 'LOJA', icon: 'storefront', description: 'Prepare comerciantes, serviços e mercadorias.', fields: [
    { key: 'comerciante', label: 'Comerciante', placeholder: 'Nome e descrição do vendedor' },
    { key: 'local', label: 'Localização', placeholder: 'Cidade, rua ou região' },
    { key: 'moeda', label: 'Moeda / preços', placeholder: 'PO, PP, créditos...' },
    { key: 'servicos', label: 'Serviços oferecidos', placeholder: 'Consertos, hospedagem, poções...' },
    { key: 'estoque', label: 'Estoque em destaque', placeholder: 'Itens e preços principais...', multiline: true },
  ] },
  { id: 'items', title: 'Criador de itens', typeLabel: 'ITEM', icon: 'auto-awesome', description: 'Registre equipamentos, tesouros e objetos especiais.', fields: [
    { key: 'categoria', label: 'Categoria', placeholder: 'Arma, armadura, consumível, relíquia...' },
    { key: 'raridade', label: 'Raridade', placeholder: 'Comum, incomum, raro, lendário...' },
    { key: 'preco', label: 'Valor / peso', placeholder: 'Ex.: 120 PO · 2 kg' },
    { key: 'efeito', label: 'Efeito e propriedades', placeholder: 'Bônus, cargas, requisito ou efeito narrativo...', multiline: true },
    { key: 'origem', label: 'Origem / história', placeholder: 'De onde veio este item?' },
  ] },
  { id: 'monsters', title: 'Criação de monstros', typeLabel: 'MONSTRO', icon: 'pets', description: 'Monte fichas rápidas de criaturas para os encontros.', fields: [
    { key: 'tipo', label: 'Tipo / espécie', placeholder: 'Fera, morto-vivo, dragão...' },
    { key: 'tamanho', label: 'Tamanho', placeholder: 'Pequeno, médio, enorme...' },
    { key: 'desafio', label: 'Nível de desafio', placeholder: 'ND ou dificuldade' },
    { key: 'defesa', label: 'CA / defesa', placeholder: 'Classe de armadura ou defesa' },
    { key: 'vida', label: 'Pontos de vida', placeholder: 'Ex.: 45 (6d10 + 12)' },
    { key: 'ataques', label: 'Ataques e habilidades', placeholder: 'Ataques, dano, resistências, habilidades...', multiline: true },
    { key: 'taticas', label: 'Táticas / comportamento', placeholder: 'Como age durante o encontro?', multiline: true },
  ] },
];
const SOUND_PRESETS = ['Floresta noturna', 'Taverna movimentada', 'Viagem na estrada', 'Riacho tranquilo', 'Caverna profunda', 'Tempestade', 'Campo de batalha', 'Música de mistério'];
const MAP_COLORS = ['#263746', '#334155', '#35433B', '#4A3B36'];
const EMPTY_FIELDS = Object.fromEntries(TOOLS.flatMap((tool) => tool.fields.map((field) => [field.key, '']))) as Record<string, string>;

export default function GmToolsScreen() {
  const fontsLoaded = useAppFonts();
  const { daltonico, tipoDaltonismo } = useAcessibilidade();
  const accessible = daltonico;
  const palette = useMemo(() => ({
    bg: COLORS.background,
    card: COLORS.surfaceContainerHigh,
    raised: COLORS.surfaceContainerLowest,
    line: COLORS.outlineVariant,
    text: COLORS.onSurface,
    muted: COLORS.onSurfaceVariant,
    accent: COLORS.primary,
    badge: COLORS.primaryContainer,
    secondary: COLORS.secondary,
  }), [daltonico, tipoDaltonismo]);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<Record<string, string>>(EMPTY_FIELDS);
  const [saved, setSaved] = useState<SavedAsset[]>([]);
  const [ready, setReady] = useState(false);
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [selectedMapColor, setSelectedMapColor] = useState(MAP_COLORS[0]);
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [detail, setDetail] = useState<SavedAsset | null>(null);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!active || !raw) return;
      const parsed = JSON.parse(raw) as SavedAsset[];
      if (Array.isArray(parsed)) setSaved(parsed);
    }).catch((error) => console.warn('Falha ao carregar criações do mestre', error)).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (ready) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved)).catch((error) => console.warn('Falha ao salvar criações do mestre', error));
  }, [saved, ready]);

  if (!fontsLoaded) return null;

  const openTool = (tool: Tool) => {
    setActiveTool(tool); setName(''); setDescription(''); setFields({ ...EMPTY_FIELDS });
    setSelectedSound(null); setImageUri(undefined); setSelectedMapColor(MAP_COLORS[0]);
  };
  const closeTool = () => setActiveTool(null);
  const saveToolContent = () => {
    if (!activeTool) return;
    const assetName = activeTool.id === 'soundboard' ? selectedSound?.trim() : name.trim();
    if (!assetName) return;
    const extra = Object.fromEntries(Object.entries(fields).filter(([, value]) => value.trim()));
    const savedAsset: SavedAsset = {
      id: `gm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      toolId: activeTool.id,
      typeLabel: activeTool.typeLabel,
      name: assetName,
      description: description.trim() || `${activeTool.title} criado pelo mestre.`,
      fields: activeTool.id === 'soundboard' ? { preset: assetName, cena: fields.cena || '' } : activeTool.id === 'maps' ? { ...extra, 'Cor de referência': selectedMapColor } : extra,
      imageUri,
      createdAt: Date.now(),
    };
    setSaved((current) => [savedAsset, ...current].slice(0, 60));
    closeTool();
  };
  const chooseImage = async () => {
    try { const uri = await pickLocalImage(activeTool?.id === 'maps' ? [16, 9] : [1, 1]); if (uri) setImageUri(uri); }
    catch { Alert.alert('Imagem indisponível', 'Não foi possível abrir a galeria. Confira as permissões e tente novamente.'); }
  };
  const removeAsset = (asset: SavedAsset) => Alert.alert('Excluir criação?', `Remover “${asset.name}” dos Recentes do Mestre?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: () => { setSaved((current) => current.filter((item) => item.id !== asset.id)); setDetail(null); } },
  ]);
  const textStyle = (size: number, color = palette.text, bold = false) => ({ color, fontFamily: bold ? 'AtkinsonHyperlegible_700Bold' as const : 'AtkinsonHyperlegible_400Regular' as const, fontSize: size });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <AppHeader title="GM Tools" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 10 }}>
        {accessible && <View accessibilityRole="text" style={{ padding: 10, backgroundColor: palette.badge, borderRadius: 8, borderWidth: 1, borderColor: palette.line }}><Text style={textStyle(12, palette.text, true)}>Modo daltônico ativo · opções e estados também são identificados por texto e ícones.</Text></View>}
        <Text style={[textStyle(14, palette.muted), { marginBottom: 4 }]}>Ferramentas para preparar e conduzir suas aventuras.</Text>
        {TOOLS.map((tool) => (
          <Pressable key={tool.id} onPress={() => openTool(tool)} accessibilityRole="button" style={({ pressed }) => ({ minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 12, backgroundColor: pressed ? palette.raised : palette.card, borderWidth: 1, borderColor: palette.line })}>
            <View style={{ width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.raised, borderWidth: accessible ? 1 : 0, borderColor: palette.line }}><MaterialIcons name={tool.icon} size={28} color={palette.accent} /></View>
            <View style={{ flex: 1, gap: 4 }}><Text style={textStyle(17, palette.accent, true)}>{tool.title}</Text><Text style={textStyle(12, palette.muted)}>{tool.description}</Text></View>
            <MaterialIcons name="chevron-right" size={22} color={palette.secondary} />
          </Pressable>
        ))}

        <View style={{ marginTop: 14, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ flex: 1, height: 1, backgroundColor: palette.line }} /><Text style={textStyle(15, palette.accent, true)}>Recentes do mestre</Text><View style={{ flex: 1, height: 1, backgroundColor: palette.line }} /></View>
          {saved.length === 0 ? <View style={{ padding: 16, borderRadius: 10, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line }}><Text style={textStyle(13, palette.muted)}>Suas criações salvas aparecerão aqui, identificadas pelo tipo do registro.</Text></View> : saved.map((asset) => (
            <Pressable key={asset.id} onPress={() => setDetail(asset)} accessibilityRole="button" accessibilityLabel={`${asset.typeLabel}: ${asset.name}. Abrir detalhes.`} style={{ padding: 12, gap: 7, borderRadius: 10, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ minWidth: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 5, backgroundColor: palette.badge, borderWidth: accessible ? 1 : 0, borderColor: palette.line }}><MaterialIcons name={TOOLS.find((tool) => tool.id === asset.toolId)?.icon ?? 'description'} size={14} color={palette.accent} /><Text style={textStyle(10, palette.text, true)}>{asset.typeLabel}</Text></View>
                <Text numberOfLines={2} style={[textStyle(15, palette.text, true), { flex: 1 }]}>{asset.name}</Text>
                <MaterialIcons name="chevron-right" size={20} color={palette.secondary} />
              </View>
              <Text numberOfLines={2} style={textStyle(12, palette.muted)}>{asset.description}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal visible={activeTool !== null} transparent animationType="slide" onRequestClose={closeTool}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.68)' }}>
          <View style={{ maxHeight: '92%', padding: 18, paddingBottom: 26, gap: 14, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}><MaterialIcons name={activeTool?.icon ?? 'build'} size={25} color={palette.accent} /><View style={{ flex: 1 }}><Text style={textStyle(19, palette.text, true)}>{activeTool?.title}</Text><Text style={textStyle(11, palette.secondary, true)}>{activeTool?.typeLabel}</Text></View></View>
              <Pressable onPress={closeTool} accessibilityLabel="Fechar ferramenta" style={{ padding: 6 }}><MaterialIcons name="close" size={23} color={palette.text} /></Pressable>
            </View>
            <Text style={textStyle(13, palette.muted)}>{activeTool?.description}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12, paddingBottom: 6 }}>
              {activeTool?.id === 'soundboard' ? <>
                <Text style={textStyle(14, palette.text, true)}>Escolha um ambiente</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{SOUND_PRESETS.map((preset) => {
                  const selected = selectedSound === preset;
                  return <Pressable key={preset} onPress={() => setSelectedSound(selected ? null : preset)} accessibilityState={{ selected }} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 18, backgroundColor: selected ? palette.badge : palette.raised, borderWidth: selected || accessible ? 2 : 1, borderColor: selected ? palette.accent : palette.line }}><MaterialIcons name={selected ? 'check-circle' : 'graphic-eq'} size={15} color={selected ? palette.accent : palette.muted} /><Text style={textStyle(12, palette.text, selected)}>{preset}</Text></Pressable>;
                })}</View>
                <TextInput value={fields.cena ?? ''} onChangeText={(value) => setFields((current) => ({ ...current, cena: value }))} placeholder="Cena / momento em que será usado (opcional)" placeholderTextColor={palette.muted} style={{ minHeight: 46, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: palette.line, color: palette.text, fontSize: 14 }} />
                <Text style={textStyle(12, palette.secondary)}>A seleção é salva como preset; reprodução de áudio ainda depende dos arquivos de som.</Text>
              </> : <>
                {(activeTool?.id === 'maps' || activeTool?.id === 'npcs' || activeTool?.id === 'monsters') && <Pressable onPress={chooseImage} accessibilityRole="button" style={{ height: imageUri ? 126 : 48, overflow: 'hidden', borderRadius: 8, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.raised, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {imageUri && <Image source={{ uri: imageUri }} resizeMode="cover" style={{ position: 'absolute', width: '100%', height: '100%' }} />}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: palette.bg }}><MaterialIcons name={imageUri ? 'edit' : 'add-photo-alternate'} size={17} color={palette.accent} /><Text style={textStyle(12, palette.text, true)}>{imageUri ? 'Trocar imagem' : 'Adicionar imagem do aparelho'}</Text></View>
                </Pressable>}
                <TextInput value={name} onChangeText={setName} placeholder={`Nome ${activeTool?.id === 'npcs' ? 'do NPC' : activeTool?.id === 'monsters' ? 'do monstro' : activeTool?.id === 'maps' ? 'do mapa' : activeTool?.id === 'shops' ? 'da loja' : 'do item'}`} placeholderTextColor={palette.muted} accessibilityLabel="Nome da criação" style={{ minHeight: 48, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: palette.line, color: palette.text, backgroundColor: palette.raised, fontSize: 15 }} />
                {activeTool?.id === 'maps' && <View style={{ gap: 8 }}><Text style={textStyle(13, palette.text, true)}>Cor indicativa do mapa (a seleção também é identificada por ícone)</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>{MAP_COLORS.map((color, index) => <Pressable key={color} onPress={() => setSelectedMapColor(color)} accessibilityLabel={`Cor de mapa ${index + 1}${selectedMapColor === color ? ', selecionada' : ''}`} accessibilityState={{ selected: selectedMapColor === color }} style={{ width: 48, height: 40, borderRadius: 8, backgroundColor: color, borderWidth: selectedMapColor === color ? 3 : 1, borderColor: selectedMapColor === color ? palette.accent : palette.line, alignItems: 'center', justifyContent: 'center' }}>{selectedMapColor === color && <MaterialIcons name="check" size={19} color="#FFFFFF" />}</Pressable>)}</View></View>}
                {activeTool?.fields.map((field) => <View key={field.key} style={{ gap: 5 }}><Text style={textStyle(12, palette.text, true)}>{field.label}</Text><TextInput value={fields[field.key] ?? ''} onChangeText={(value) => setFields((current) => ({ ...current, [field.key]: value }))} placeholder={field.placeholder} placeholderTextColor={palette.muted} multiline={field.multiline} accessibilityLabel={field.label} style={{ minHeight: field.multiline ? 82 : 45, padding: 11, borderRadius: 8, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.raised, color: palette.text, fontSize: 14, textAlignVertical: field.multiline ? 'top' : 'center' }} /></View>)}
              </>}
              <TextInput value={description} onChangeText={setDescription} placeholder="Observações gerais (opcional)" placeholderTextColor={palette.muted} multiline accessibilityLabel="Observações gerais" style={{ minHeight: 76, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.raised, color: palette.text, fontSize: 14, textAlignVertical: 'top' }} />
            </ScrollView>
            <Pressable onPress={saveToolContent} disabled={activeTool?.id === 'soundboard' ? !selectedSound : !name.trim()} accessibilityRole="button" style={{ minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 8, backgroundColor: (activeTool?.id === 'soundboard' ? selectedSound : name.trim()) ? palette.accent : palette.raised, borderWidth: 1, borderColor: palette.line }}><MaterialIcons name="save" size={20} color={accessible ? '#101820' : COLORS.onPrimary} /><Text style={textStyle(15, accessible ? '#101820' : COLORS.onPrimary, true)}>{activeTool?.id === 'soundboard' ? 'Salvar preset' : `Salvar ${activeTool?.typeLabel ?? 'criação'}`}</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={detail !== null} transparent animationType="fade" onRequestClose={() => setDetail(null)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.72)' }}><View style={{ maxHeight: '82%', padding: 18, gap: 12, borderRadius: 14, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ paddingHorizontal: 9, paddingVertical: 6, backgroundColor: palette.badge, borderRadius: 5 }}><Text style={textStyle(11, palette.text, true)}>{detail?.typeLabel}</Text></View><Text style={[textStyle(19, palette.text, true), { flex: 1 }]}>{detail?.name}</Text><Pressable onPress={() => setDetail(null)} accessibilityLabel="Fechar detalhes"><MaterialIcons name="close" size={22} color={palette.text} /></Pressable></View>
          {detail?.imageUri && <Image source={{ uri: detail.imageUri }} resizeMode="cover" style={{ width: '100%', height: 145, borderRadius: 8 }} />}
          <Text style={textStyle(13, palette.muted)}>{detail?.description}</Text>
          <ScrollView contentContainerStyle={{ gap: 9 }}>{Object.entries(detail?.fields ?? {}).map(([key, value]) => <View key={key} style={{ padding: 10, borderRadius: 7, backgroundColor: palette.raised, borderWidth: 1, borderColor: palette.line }}><Text style={textStyle(11, palette.secondary, true)}>{key}</Text><Text style={textStyle(13, palette.text)}>{value}</Text></View>)}</ScrollView>
          <Pressable onPress={() => detail && removeAsset(detail)} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 8, borderWidth: 1, borderColor: palette.line }}><MaterialIcons name="delete-outline" size={19} color={palette.text} /><Text style={textStyle(13, palette.text, true)}>Excluir criação</Text></Pressable>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}
