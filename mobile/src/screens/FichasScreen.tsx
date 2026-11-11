import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../components/accessible-text';
import { Avatar, StateBlock } from '../components/Controls';
import { COLORS, appFontSize } from '../design/shared';
import { useAcessibilidade } from '../store/acessibilidade';
import { useCharacters } from '../store/useCharacters';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';

/** Lista de fichas do usuário (mesma da web): avatar, nome, classe · raça · nível, PV com barra e CA. */
export default function FichasScreen() {
  useAcessibilidade();
  const router = useRouter();
  const { characters, loading, error, loaded, load } = useCharacters();

  // Recarrega ao voltar para a tela (uma ficha pode ter sido criada/editada em outra tela ou aparelho)
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const open = (id: string) => router.push(`/personagens?id=${id}` as any);
  const edit = (id: string) => router.push(`/criar-personagem?id=${id}` as any);

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 8 }}
        refreshControl={<RefreshControl refreshing={loading && loaded} onRefresh={load} tintColor={COLORS.primary} />}>
        <Pressable onPress={() => router.push('/criar-personagem')} accessibilityRole="button" accessibilityLabel="Nova ficha"
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -6 }}>
          <MaterialIcons name="add" size={36} color={COLORS.onSurfaceVariant} />
        </Pressable>

        {characters.map((c) => (
          <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, backgroundColor: COLORS.tile }}>
            <Pressable onPress={() => open(c.id)} accessibilityRole="button" accessibilityLabel={`Abrir ficha de ${c.name}. ${c.class}, ${c.race}, nível ${c.level}`}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar uri={c.avatar_url} name={c.name} size={42} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: COLORS.onSurface, fontSize: appFontSize(15), fontFamily: 'SourceSerif4_700Bold' }}>{c.name}</Text>
                <Text numberOfLines={1} style={{ color: COLORS.onSurfaceVariant, fontSize: appFontSize(12), fontFamily: BODY }}>{[c.class, c.race].filter(Boolean).join(' · ')} · Nível {c.level}</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => edit(c.id)} accessibilityRole="button" accessibilityLabel={`Editar ${c.name}`}
              style={{ minHeight: 34, paddingHorizontal: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.btn, shadowColor: '#fff', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }}>
              <Text style={{ color: COLORS.btnText, fontFamily: BODY, fontSize: appFontSize(13) }}>Editar</Text>
            </Pressable>
          </View>
        ))}

        {!loaded && loading && <StateBlock icon="hourglass-empty" title="Carregando suas fichas…" text="Na primeira abertura o servidor pode levar alguns segundos para acordar." />}
        {error && !loaded && <StateBlock icon="cloud-off" title="Não foi possível carregar as fichas" text={error} actionLabel="Tentar de novo" onAction={load} />}
        {loaded && characters.length === 0 && (
          <StateBlock icon="badge" title="Sua primeira ficha começa aqui" text="Crie um herói, escolha uma foto e acompanhe PV, atributos e magias."
            actionLabel="Criar ficha" onAction={() => router.push('/criar-personagem')} />
        )}
      </ScrollView>

    </SafeAreaView>
  );
}
