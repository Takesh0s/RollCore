import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../components/accessible-text';
import { AppHeader } from '../components/AppHeader';
import { Avatar, StateBlock } from '../components/Controls';
import { COLORS, Card, appFontSize } from '../design/shared';
import { useAcessibilidade } from '../store/acessibilidade';
import { useCharacters } from '../store/useCharacters';

const BODY = 'Inter_400Regular';
const BOLD = 'Inter_700Bold';

/** O inventário é de cada ficha: esta tela escolhe o personagem e abre a aba Inventário dele. */
export default function InventarioScreen() {
  useAcessibilidade();
  const router = useRouter();
  const { characters, loading, error, loaded, load } = useCharacters();
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Inventário" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}>
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>Escolha de qual personagem você quer ver o inventário.</Text>
        {characters.map((c) => (
          <Card key={c.id}>
            <Pressable onPress={() => router.push(`/personagens?id=${c.id}&tab=inventory` as any)} accessibilityRole="button" accessibilityLabel={`Abrir inventário de ${c.name}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar uri={c.avatar_url} name={c.name} size={52} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(18) }}>{c.name}</Text>
                <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{c.class} · {c.race} · Nível {c.level}</Text>
              </View>
              <Text style={{ color: COLORS.primary, fontFamily: BOLD, fontSize: appFontSize(13) }}>Abrir ›</Text>
            </Pressable>
          </Card>
        ))}
        {!loaded && loading && <StateBlock icon="hourglass-empty" title="Carregando suas fichas…" />}
        {error && !loaded && <StateBlock icon="cloud-off" title="Não foi possível carregar as fichas" text={error} actionLabel="Tentar de novo" onAction={load} />}
        {loaded && characters.length === 0 && (
          <StateBlock icon="inventory-2" title="Nenhuma ficha ainda" text="O inventário fica dentro da ficha de cada personagem. Crie uma ficha para começar."
            actionLabel="Criar ficha" onAction={() => router.push('/criar-personagem')} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
