import { useAcessibilidade } from '../../store/acessibilidade';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ImageBackground, Modal, Pressable as NativePressable, ScrollView, Text as NativeText, TextInput as NativeTextInput, View } from 'react-native';
import { AccessibleText as Text, AccessibleTextInput as TextInput, AccessiblePressable as Pressable } from '../../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, appFontSize } from '../../design/shared';
import { mensagemDeErro } from '../../services/api';
import { carregarMesas, removeMesa, useMesas, useMesasStatus } from '../../store/mesas';

const COVERS: Record<string, string> = {
  strahd: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0QJzoailqXRucEkipJju_1KNsEjPvsB4A5em7pd30adzbsQ_lCHq6ANuX964zpnysn5suxi2Gx8jNHsJGCFmIQljHgpbyArmqTjstxI7gaeC0L9C5Pe9CC1TP3qzP5uT9w1cED47VfEX6o8fpz7X2dWgMDHHtqIgKoMOE2YpYplGraTOQs7p6Zz4V0OszoS2grsD6UjqaWtTajH6CIahtKj94iYXKm1LQC4SQlF0FWvsF8qc_Eo68Xw',
  arkham: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBG_D6mDWpzHXRzjggVjLUL5JdU_RNPkTvCE4QCpLuuLz59xr7YeMTOiw6m8HH3viawqVoPO6bV_K7U37Ww-uA600QxWxPZ8zb6NF_Q0cXgUUjse0dwDQXbqDfYQ-_bNI5PP9R-0dH4B_S4gPRrRa-d37s0lNufm2UkJVDwxYLyfW69-ee_NbuHT7I9TjZh6nkdGhYdEVUJkOmn72AdL__hcMyNPvbi7jbgRBCqvnWMq9pv6RUcz1nmow',
};
const FALLBACK_COVERS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCWZFiC5LkXFDApFv_2__1AVHR3HAEQ62xdK3_qvfml591AbsliGPvX88KX3B2ycJwkxfppUmj42GD76Gi2fS8XiAOYsWSJZXR5jZhcSAcEtb0vmi8a9jOMQcyoxjaAe6r9blJFQ_FrSn2ig4hPc0CxIS-VK3QyS6EcCRdUK6IY9pEgEMe4AH-3Aa5_j0mrhkdCPTmEWNmnncVJgV77Uy8QPJEst4m9ocmKV0xUdBXvbRMc7MDsElsLRw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBTLsdSbHiMSVoNu3p-uYpi3ztwYMsJ7M43CKns4oVWiKSOltlCNleAcLdGXuggJMxtapvIfCHNiHO69ZeQBjpv46gC_WU2MbG3k9HXmF0jiDuKXlt7MtP6GFw6KycQonKVjsWrUHAyF4_aeIm0qWIzsTw2EN8PBHH0uDvWbpWnQnwFpYbtHRyhAZ6N6m1aUXyakJBa8yCiphOpO58c2tHJBmLHXDK8h_8OtV3ManFjU35uvfC6NfMXgQ',
];

export default function MesasScreen() {
  useAcessibilidade();
  const router = useRouter();
  const mesas = useMesas();
  const { carregando, erro } = useMesasStatus();
  useFocusEffect(useCallback(() => { void carregarMesas(); }, []));
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'Todas' | 'Mestre' | 'Jogador'>('Todas');

  const filteredTables = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    return mesas.filter((mesa) => {
      const matchesQuery = !normalized || `${mesa.titulo} ${mesa.sistema} ${mesa.descricao ?? ''}`.toLocaleLowerCase('pt-BR').includes(normalized);
      return matchesQuery && (roleFilter === 'Todas' || mesa.papel === roleFilter);
    });
  }, [mesas, query, roleFilter]);

  const confirmDelete = (id: string, title: string, mestre: boolean) => Alert.alert(
    mestre ? 'Editar mesa' : 'Mesa',
    `O que deseja fazer com “${title}”?`,
    [
      { text: 'Cancelar', style: 'cancel' },
      ...(mestre ? [{ text: 'Editar', onPress: () => router.push(`/mesa?id=${id}` as any) }] : []),
      { text: 'Abrir mesa', onPress: () => router.push(`/sessao/${id}` as any) },
      {
        text: mestre ? 'Excluir' : 'Sair da mesa',
        style: 'destructive' as const,
        onPress: () => { removeMesa(id).catch((error) => Alert.alert(mestre ? 'Não foi possível excluir' : 'Não foi possível sair', mensagemDeErro(error))); },
      },
    ],
  );

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 46 }}>
          <MaterialIcons name="search" size={24} color={COLORS.onSurfaceVariant} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar mesas..."
            placeholderTextColor={COLORS.outline}
            accessibilityLabel="Buscar mesas"
            style={{ flex: 1, height: 42, color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(15), borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant }}
          />
          <Pressable onPress={() => setFilterOpen(true)} accessibilityLabel="Filtrar mesas" style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="filter-list" size={24} color={roleFilter === 'Todas' ? COLORS.onSurfaceVariant : COLORS.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28, gap: 16 }}>
        {filteredTables.map((mesa, index) => {
          const cover = mesa.imagemUri ?? COVERS[mesa.id] ?? FALLBACK_COVERS[index % FALLBACK_COVERS.length];
          return (
            <View key={mesa.id} style={{ overflow: 'hidden', backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
              <Pressable onPress={() => router.push(`/sessao/${mesa.id}` as any)} accessibilityRole="button" accessibilityLabel={`Abrir mesa ${mesa.titulo}`}>
                <ImageBackground source={{ uri: cover }} resizeMode="cover" style={{ height: 178, justifyContent: 'space-between' }}>
                  <View style={{ paddingHorizontal: 10, paddingTop: 9 }}>
                    <Text numberOfLines={2} style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(17), textShadowColor: '#000', textShadowRadius: 8, textShadowOffset: { width: 1, height: 1 } }}>{mesa.titulo}</Text>
                    <Text style={{ marginTop: 3, color: '#fff', fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(11), textShadowColor: '#000', textShadowRadius: 6 }}>{mesa.sistema}</Text>
                  </View>
                  <View style={{ alignItems: 'center', paddingBottom: 10 }}>
                    <View style={{ minWidth: 106, minHeight: 34, paddingHorizontal: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(53,56,57,0.88)', borderWidth: 1, borderColor: COLORS.outlineVariant }}>
                      <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>Entrar</Text>
                    </View>
                  </View>
                </ImageBackground>
              </Pressable>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 9 }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name="event" size={16} color={COLORS.onSurfaceVariant} />
                  <Text numberOfLines={1} style={{ flex: 1, color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(12) }}>{mesa.proximaSessao}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: COLORS.surfaceContainerHighest }}>
                    <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(10) }}>{mesa.papel}</Text>
                  </View>
                  <Pressable onPress={() => confirmDelete(mesa.id, mesa.titulo, mesa.papelApi === 'MASTER')} accessibilityLabel={`Editar ${mesa.titulo}`} style={{ padding: 4 }}>
                    <MaterialIcons name="more-vert" size={20} color={COLORS.onSurfaceVariant} />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}

        {filteredTables.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 8 }}>
            <MaterialIcons name={erro ? 'cloud-off' : carregando ? 'hourglass-empty' : 'search-off'} size={36} color={COLORS.outline} />
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14), textAlign: 'center' }}>
              {erro ? erro : carregando ? 'Carregando suas mesas… se o servidor estiver dormindo, pode levar até 1 minuto.' : mesas.length === 0 ? 'Você ainda não tem mesas. Toque em + para criar uma ou entrar com um código.' : 'Nenhuma mesa encontrada.'}
            </Text>
            {erro ? <Pressable onPress={() => { void carregarMesas(); }} accessibilityRole="button" style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
              <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>Tentar de novo</Text>
            </Pressable> : null}
          </View>
        )}
      </ScrollView>

      <Pressable onPress={() => router.push('/mesa' as any)} accessibilityRole="button" accessibilityLabel="Criar ou entrar em mesa" style={{ position: 'absolute', right: 18, bottom: 18, width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryContainer, borderWidth: 1, borderColor: COLORS.primary }}>
        <MaterialIcons name="add" size={29} color={COLORS.onPrimaryContainer} />
      </Pressable>

      <Modal transparent animationType="fade" visible={filterOpen} onRequestClose={() => setFilterOpen(false)}>
        <Pressable onPress={() => setFilterOpen(false)} style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.62)' }}>
          <Pressable onPress={(event) => event.stopPropagation()} style={{ padding: 18, gap: 12, borderRadius: 14, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
            <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(20) }}>Filtrar mesas</Text>
            {(['Todas', 'Mestre', 'Jogador'] as const).map((option) => {
              const selected = roleFilter === option;
              return (
                <Pressable key={option} onPress={() => { setRoleFilter(option); setFilterOpen(false); }} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, borderRadius: 8, backgroundColor: selected ? COLORS.surfaceContainerHighest : 'transparent' }}>
                  <MaterialIcons name={selected ? 'radio-button-checked' : 'radio-button-unchecked'} size={20} color={selected ? COLORS.primary : COLORS.onSurfaceVariant} />
                  <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(15) }}>{option === 'Todas' ? 'Todas as mesas' : `Sou ${option.toLocaleLowerCase('pt-BR')}`}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
