import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../components/accessible-text';
import { Btn, StateBlock, inputStyle } from '../components/Controls';
import { TableBanner } from '../components/tables/TableBanner';
import { JoinTableModal } from '../components/tables/TableModals';
import { COLORS, appFontSize } from '../design/shared';
import { useAcessibilidade } from '../store/acessibilidade';
import { useTables } from '../store/useTables';

const BODY = 'Inter_400Regular';

/** Lista de mesas do usuário (mesma do web), com busca por nome, "Entrar com código" e criar mesa. */
export default function MesasScreen() {
  useAcessibilidade();
  const router = useRouter();
  const { tables, loading, loaded, failed, load } = useTables();
  const [query, setQuery] = useState('');
  const [joining, setJoining] = useState(false);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const q = query.trim().toLowerCase();
  const shown = q ? tables.filter((t) => t.name.toLowerCase().includes(q)) : tables;
  const create = () => router.push('/mesa' as any);
  const open = (id: string) => router.push(`/sessao/${id}` as any);

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }} keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading && loaded} onRefresh={load} tintColor={COLORS.primary} />}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, ...inputStyle(), borderRadius: 24, borderWidth: 0 }}>
          <MaterialIcons name="search" size={20} color={COLORS.fieldText} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Buscar mesa" placeholderTextColor={COLORS.placeholder} accessibilityLabel="Buscar mesa"
            style={{ flex: 1, color: COLORS.fieldText, fontFamily: BODY, fontSize: appFontSize(16) }} returnKeyType="search" />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <View style={{ flex: 1 }}><Btn label="Entrar com código" onPress={() => setJoining(true)} /></View>
          <Pressable onPress={create} accessibilityRole="button" accessibilityLabel="Criar mesa"
            style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.btn }}>
            <MaterialIcons name="add" size={28} color={COLORS.btnText} />
          </Pressable>
        </View>

        {!loaded && loading && <StateBlock icon="hourglass-empty" title="Carregando suas mesas…" text="Se o servidor estiver dormindo, pode levar até 1 minuto." />}
        {failed && !loaded && <StateBlock icon="cloud-off" title="Não foi possível carregar as mesas" text="Tente novamente mais tarde." actionLabel="Tentar de novo" onAction={load} />}
        {loaded && tables.length === 0 && (
          <StateBlock icon="groups" title="Nenhuma mesa ainda" text="Crie uma mesa ou entre em uma para começar a jogar." actionLabel="Criar mesa" onAction={create} />
        )}
        {loaded && tables.length > 0 && shown.length === 0 && (
          <StateBlock icon="search-off" title="Nada encontrado" text="Tente outros termos ou ajuste a busca." actionLabel="Limpar busca" onAction={() => setQuery('')} />
        )}
        {shown.map((t) => <TableBanner key={t.id} table={t} onEnter={() => open(t.id)} />)}
      </ScrollView>
      {joining && <JoinTableModal onClose={() => setJoining(false)} onJoined={(id) => { setJoining(false); router.push(`/sessao/${id}` as any); }} />}
    </SafeAreaView>
  );
}
