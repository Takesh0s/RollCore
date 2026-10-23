import { useAcessibilidade } from '../store/acessibilidade';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable as NativePressable, ScrollView, Text as NativeText, TextInput as NativeTextInput, View } from 'react-native';
import { AccessibleText as Text, AccessibleTextInput as TextInput, AccessiblePressable as Pressable } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Header, appFontSize } from '../design/shared';

interface Rolagem {
  id: string;
  faces: number;
  dados: number[];
  modificador: number;
  total: number;
  criadaEm: number;
}

const DADOS = [4, 6, 8, 10, 12, 20, 100];
const STORAGE_KEY = '@rollcore/historico-dados-v1';

export default function DadosScreen() {
  useAcessibilidade();
  const router = useRouter();
  const [faces, setFaces] = useState(20);
  const [quantidade, setQuantidade] = useState('1');
  const [modificador, setModificador] = useState('0');
  const [ultima, setUltima] = useState<Rolagem | null>(null);
  const [historico, setHistorico] = useState<Rolagem[]>([]);
  const [restaurado, setRestaurado] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        const parsed = JSON.parse(raw) as Rolagem[];
        if (Array.isArray(parsed)) setHistorico(parsed);
      }
    }).catch((error) => console.warn('Falha ao carregar histórico de dados', error)).finally(() => setRestaurado(true));
  }, []);

  useEffect(() => {
    if (restaurado) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(historico)).catch((error) => console.warn('Falha ao salvar histórico de dados', error));
  }, [historico, restaurado]);

  const rolar = () => {
    const qtd = Math.max(1, Math.min(20, Math.floor(Number(quantidade) || 1)));
    const mod = Math.max(-99, Math.min(99, Math.trunc(Number(modificador) || 0)));
    const valores = Array.from({ length: qtd }, () => Math.floor(Math.random() * faces) + 1);
    const total = valores.reduce((soma, valor) => soma + valor, 0) + mod;
    const item: Rolagem = { id: `${Date.now()}-${Math.random()}`, faces, dados: valores, modificador: mod, total, criadaEm: Date.now() };
    setUltima(item);
    setHistorico((current) => [item, ...current].slice(0, 30));
  };

  const limpar = () => Alert.alert('Limpar histórico?', 'As rolagens salvas neste aparelho serão apagadas.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Limpar', style: 'destructive', onPress: () => { setHistorico([]); setUltima(null); } },
  ]);

  const critico = ultima?.faces === 20 && ultima.dados.length === 1 && ultima.dados[0] === 20;
  const falhaCritica = ultima?.faces === 20 && ultima.dados.length === 1 && ultima.dados[0] === 1;
  const notation = `${quantidade || 1}d${faces}${Number(modificador) ? ` ${Number(modificador) > 0 ? '+' : ''}${Number(modificador)}` : ''}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Dados" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 18 }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 176, padding: 18, backgroundColor: COLORS.surfaceContainer, borderRadius: 14, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>{ultima ? `${ultima.dados.length}d${ultima.faces}${ultima.modificador ? ` ${ultima.modificador > 0 ? '+' : ''}${ultima.modificador}` : ''}` : 'Sua próxima rolagem'}</Text>
          <Text style={{ color: critico ? '#70B596' : falhaCritica ? '#F87171' : COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(68), lineHeight: 78 }}>{ultima?.total ?? '–'}</Text>
          {ultima && <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(13) }}>Dados: {ultima.dados.join(' + ')}{ultima.modificador ? ` ${ultima.modificador > 0 ? '+' : '−'} ${Math.abs(ultima.modificador)}` : ''}</Text>}
          {critico && <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13), marginTop: 4 }}>20 NATURAL · ACERTO CRÍTICO</Text>}
          {falhaCritica && <Text style={{ color: '#F87171', fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13), marginTop: 4 }}>1 NATURAL · FALHA CRÍTICA</Text>}
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>Escolha o dado</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 9 }}>
            {DADOS.map((n) => {
              const selected = faces === n;
              return <Pressable key={n} onPress={() => setFaces(n)} accessibilityState={{ selected }} style={{ width: 70, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: selected ? COLORS.primary : COLORS.outlineVariant, backgroundColor: selected ? COLORS.primaryContainer : COLORS.surfaceContainer }}>
                <MaterialIcons name="casino" size={18} color={selected ? COLORS.primary : COLORS.onSurfaceVariant} /><Text style={{ color: selected ? COLORS.primary : COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>d{n}</Text>
              </Pressable>;
            })}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13) }}>Quantidade (1–20)</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46, paddingHorizontal: 8, backgroundColor: COLORS.surfaceContainerLowest, borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 8 }}>
              <Pressable onPress={() => setQuantidade(String(Math.max(1, Number(quantidade || 1) - 1)))} accessibilityLabel="Diminuir quantidade"><MaterialIcons name="remove" size={21} color={COLORS.primary} /></Pressable>
              <TextInput value={quantidade} onChangeText={setQuantidade} keyboardType="number-pad" selectTextOnFocus style={{ minWidth: 40, textAlign: 'center', color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(16) }} />
              <Pressable onPress={() => setQuantidade(String(Math.min(20, Number(quantidade || 1) + 1)))} accessibilityLabel="Aumentar quantidade"><MaterialIcons name="add" size={21} color={COLORS.primary} /></Pressable>
            </View>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13) }}>Modificador</Text>
            <TextInput value={modificador} onChangeText={setModificador} keyboardType="numbers-and-punctuation" placeholder="0" placeholderTextColor={COLORS.outline} style={{ minHeight: 46, paddingHorizontal: 12, backgroundColor: COLORS.surfaceContainerLowest, borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 8, color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(16) }} />
          </View>
        </View>

        <Pressable onPress={rolar} style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 9, backgroundColor: COLORS.primary }}>
          <MaterialIcons name="casino" size={22} color={COLORS.onPrimary} /><Text style={{ color: COLORS.onPrimary, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(17) }}>Rolar {notation}</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(18) }}>Histórico recente</Text>
          {historico.length > 0 && <Pressable onPress={limpar}><Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(12) }}>Limpar</Text></Pressable>}
        </View>
        {historico.length === 0 ? <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14) }}>As rolagens recentes aparecerão aqui.</Text> : historico.map((item) => (
          <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: COLORS.surfaceContainer, borderRadius: 8, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
            <View><Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>{item.dados.length}d{item.faces}{item.modificador ? ` ${item.modificador > 0 ? '+' : ''}${item.modificador}` : ''}</Text><Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(11) }}>[{item.dados.join(', ')}]{item.modificador ? ` ${item.modificador > 0 ? '+' : '−'} ${Math.abs(item.modificador)}` : ''}</Text></View>
            <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(23) }}>{item.total}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
