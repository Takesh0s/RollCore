import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Image, RefreshControl, ScrollView, View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../components/accessible-text';
import { StateBlock } from '../components/Controls';
import { NavIcon } from '../components/NavIcon';
import { COLORS, appFontSize } from '../design/shared';
import { imageSrc } from '../lib/mapImage';
import { useAcessibilidade } from '../store/acessibilidade';
import { useCharacters } from '../store/useCharacters';

const BODY = 'Inter_400Regular';
const SERIF = 'SourceSerif4_700Bold';
const BTN = 'FugazOne_400Regular';

/** Lista de fichas, como no MobileCharacterList do web: "+" no topo e uma linha por ficha (avatar, nome, classe · raça · nível, "Editar"). */
export default function FichasScreen() {
  useAcessibilidade();
  const router = useRouter();
  const { characters, loading, error, loaded, load } = useCharacters();

  // Recarrega ao voltar para a tela (uma ficha pode ter sido criada/editada em outra tela ou aparelho)
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const open = (id: string) => router.push(`/personagens?id=${id}` as any);
  const edit = (id: string) => router.push(`/criar-personagem?id=${id}` as any);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 14, paddingBottom: 16 }}
        refreshControl={<RefreshControl refreshing={loading && loaded} onRefresh={load} tintColor="#70B596" />}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <Pressable onPress={() => router.push('/criar-personagem')} accessibilityRole="button" accessibilityLabel="Nova ficha" style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
            <NavIcon name="plus" size={30} color="#C0C0C0" />
          </Pressable>
        </View>

        {characters.map((c) => (
          <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 8, marginBottom: 4, backgroundColor: 'rgba(0,0,0,0.14)' }}>
            <Pressable onPress={() => open(c.id)} accessibilityRole="button" accessibilityLabel={`Abrir ficha de ${c.name}. ${c.class}, ${c.race}, nível ${c.level}`}
              style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {imageSrc(c.avatar_url)
                ? <Image source={{ uri: imageSrc(c.avatar_url)! }} style={{ width: 42, height: 42, borderRadius: 21 }} />
                : <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
                    <Text style={{ color: '#353E43', fontFamily: SERIF, fontSize: appFontSize(18) }}>{c.name.charAt(0).toUpperCase()}</Text>
                  </View>}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ color: '#C0C0C0', fontFamily: SERIF, fontSize: appFontSize(15) }}>{c.name}</Text>
                <Text numberOfLines={1} style={{ color: '#9AA4A8', fontFamily: BODY, fontSize: appFontSize(11) }}>{`${c.class} · ${c.race} · Nível ${c.level}`}</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => edit(c.id)} accessibilityRole="button" accessibilityLabel={`Editar ${c.name}`}
              style={{ paddingVertical: 5, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#252525', shadowColor: '#fff', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 3 }}>
              <Text style={{ color: '#6A89A7', fontFamily: BTN, fontSize: appFontSize(13) }}>Editar</Text>
            </Pressable>
          </View>
        ))}

        {!loaded && loading && <StateBlock icon="hourglass-empty" title="Carregando suas fichas…" text="Na primeira abertura o servidor pode levar alguns segundos para acordar." />}
        {error && !loaded && <StateBlock icon="cloud-off" title="Não foi possível carregar as fichas" text={error} actionLabel="Tentar de novo" onAction={load} />}
        {loaded && characters.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 8 }}>
            <Text style={{ color: '#C0C0C0', fontFamily: BODY, fontSize: appFontSize(15) }}>Nenhuma ficha criada ainda.</Text>
            <Pressable onPress={() => router.push('/criar-personagem')} accessibilityRole="button"
              style={{ marginTop: 20, paddingVertical: 10, paddingHorizontal: 26, minWidth: 132, alignItems: 'center', borderRadius: 14, backgroundColor: '#252525', shadowColor: '#fff', shadowOpacity: 0.35, shadowRadius: 7, shadowOffset: { width: 0, height: 0 }, elevation: 4 }}>
              <Text style={{ color: '#6A89A7', fontFamily: BTN, fontSize: appFontSize(15) }}>Criar ficha</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
