import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleTextInput as TextInput } from '../components/accessible-text';
import { StateBlock } from '../components/Controls';
import { NavIcon } from '../components/NavIcon';
import { TableBanner } from '../components/tables/TableBanner';
import { JoinTableModal } from '../components/tables/TableModals';
import { BODY, PillBtn } from '../components/tables/parts';
import { COLORS, appFontSize } from '../design/shared';
import { useAcessibilidade } from '../store/acessibilidade';
import { useTables } from '../store/useTables';

/** Lista de mesas (TableListScreen do web): busca, "Entrar com código", "+" e uma faixa por mesa. */
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
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ paddingTop: 14, paddingHorizontal: 14, paddingBottom: 18 }} keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading && loaded} onRefresh={load} tintColor="#70B596" />}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.18)' }}>
            <NavIcon name="search" size={22} color={COLORS.onSurfaceVariant} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Buscar mesa" placeholderTextColor={COLORS.outline} accessibilityLabel="Buscar mesa" returnKeyType="search"
              style={{ flex: 1, minWidth: 0, paddingVertical: 8, color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(14) }} />
          </View>
          <PillBtn label="Entrar com código" onPress={() => setJoining(true)} />
          <Pressable onPress={create} accessibilityRole="button" accessibilityLabel="Criar mesa" style={{ width: 38, height: 34, marginLeft: 6, alignItems: 'center', justifyContent: 'center' }}>
            <NavIcon name="plus" size={30} color={COLORS.onSurfaceVariant} />
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
    </View>
  );
}
