import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../components/accessible-text';
import { Avatar, StateBlock } from '../components/Controls';
import { COLORS, Card, appFontSize } from '../design/shared';
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
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 104, gap: 14 }}
        refreshControl={<RefreshControl refreshing={loading && loaded} onRefresh={load} tintColor={COLORS.primary} />}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: COLORS.primary, fontSize: appFontSize(20), fontFamily: 'SourceSerif4_700Bold' }}>Os Meus Heróis</Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontSize: appFontSize(13), fontFamily: BODY }}>
            {characters.length} {characters.length === 1 ? 'personagem' : 'personagens'}
          </Text>
        </View>

        {characters.map((c) => {
          const pct = c.max_hp > 0 ? Math.max(0, Math.min(100, (c.hp / c.max_hp) * 100)) : 0;
          return (
            <Card key={c.id}>
              <View style={{ gap: 12 }}>
                <Pressable onPress={() => open(c.id)} accessibilityRole="button" accessibilityLabel={`Abrir ficha de ${c.name}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar uri={c.avatar_url} name={c.name} size={62} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.onSurfaceVariant, fontSize: appFontSize(11), fontFamily: BOLD, textTransform: 'uppercase' }}>
                      {c.class} · {c.race} · Nível {c.level}
                    </Text>
                    <Text numberOfLines={1} style={{ color: COLORS.primary, fontSize: appFontSize(19), fontFamily: 'SourceSerif4_700Bold', marginTop: 3 }}>{c.name}</Text>
                    <Text style={{ color: COLORS.secondary, fontSize: appFontSize(12), fontFamily: BODY, marginTop: 4 }}>HP {c.hp}/{c.max_hp} · CA {c.ac}</Text>
                  </View>
                </Pressable>
                <View accessibilityElementsHidden style={{ height: 6, borderRadius: 3, backgroundColor: COLORS.surfaceContainerLowest, overflow: 'hidden' }}>
                  <View style={{ width: `${pct}%`, height: '100%', backgroundColor: pct < 60 ? '#e8a020' : COLORS.primary }} />
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable onPress={() => open(c.id)} accessibilityLabel={`Abrir ${c.name}`}
                    style={{ flex: 1, minHeight: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
                    <Text style={{ color: COLORS.onPrimary, fontFamily: BOLD, fontSize: appFontSize(14) }}>Abrir</Text>
                  </Pressable>
                  <Pressable onPress={() => edit(c.id)} accessibilityLabel={`Editar ${c.name}`}
                    style={{ flex: 1, minHeight: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, backgroundColor: COLORS.primaryContainer }}>
                    <MaterialIcons name="edit" size={16} color={COLORS.onPrimaryContainer} />
                    <Text style={{ color: COLORS.onPrimaryContainer, fontFamily: BOLD, fontSize: appFontSize(14) }}>Editar</Text>
                  </Pressable>
                </View>
              </View>
            </Card>
          );
        })}

        {!loaded && loading && <StateBlock icon="hourglass-empty" title="Carregando suas fichas…" text="Na primeira abertura o servidor pode levar alguns segundos para acordar." />}
        {error && !loaded && <StateBlock icon="cloud-off" title="Não foi possível carregar as fichas" text={error} actionLabel="Tentar de novo" onAction={load} />}
        {loaded && characters.length === 0 && (
          <StateBlock icon="badge" title="Sua primeira ficha começa aqui" text="Crie um herói, escolha uma foto e acompanhe PV, atributos e magias."
            actionLabel="Criar ficha" onAction={() => router.push('/criar-personagem')} />
        )}
      </ScrollView>

      <Pressable onPress={() => router.push('/criar-personagem')} accessibilityLabel="Nova ficha"
        style={{ position: 'absolute', right: 16, bottom: 20, width: 56, height: 56, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', elevation: 8 }}>
        <MaterialIcons name="add" size={28} color={COLORS.onPrimary} />
      </Pressable>
    </SafeAreaView>
  );
}
