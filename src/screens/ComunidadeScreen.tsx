// ComunidadeScreen.tsx — RollCore
//
// Baseada na estrutura do Figma (Comunidade - chat com participantes),
// adaptada para o tema RollCore. Lista de comunidades (servidores) com
// busca e abas "Minhas" / "Descubra". Tocar num item abre o chat.

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, useAppFonts } from '../design/shared';

interface Community {
  id: string;
  name: string;
  description: string;
  members: number;
  online: number;
  imageUri: string;
  joined?: boolean;
}

const COMMUNITIES: Community[] = [
  {
    id: 'taverna',
    name: 'Taverna dos Aventureiros',
    description: 'Ponto de encontro geral para jogadores de qualquer sistema.',
    members: 1240,
    online: 87,
    joined: true,
    imageUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD0QJzoailqXRucEkipJju_1KNsEjPvsB4A5em7pd30adzbsQ_lCHq6ANuX964zpnysn5suxi2Gx8jNHsJGCFmIQljHgpbyArmqTjstxI7gaeC0L9C5Pe9CC1TP3qzP5uT9w1cED47VfEX6o8fpz7X2dWgMDHHtqIgKoMOE2YpYplGraTOQs7p6Zz4V0OszoS2grsD6UjqaWtTajH6CIahtKj94iYXKm1LQC4SQlF0FWvsF8qc_Eo68Xw',
  },
  {
    id: 'floral-dragons',
    name: 'Clã do Dragão Floral',
    description: 'Comunidade oficial da campanha Floral Dragons.',
    members: 320,
    online: 14,
    imageUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCWZFiC5LkXFDApFv_2__1AVHR3HAEQ62xdK3_qvfml591AbsliGPvX88KX3B2ycJwkxfppUmj42GD76Gi2fS8XiAOYsWSJZXR5jZhcSAcEtb0vmi8a9jOMQcyoxjaAe6r9blJFQ_FrSn2ig4hPc0CxIS-VK3QyS6EcCRdUK6IY9pEgEMe4AH-3Aa5_j0mrhkdCPTmEWNmnncVJgV77Uy8QPJEst4m9ocmKV0xUdBXvbRMc7MDsElsLRw',
  },
  {
    id: 'mestres',
    name: 'Guilda dos Mestres',
    description: 'Dicas, apoio e discussões para quem narra as mesas.',
    members: 615,
    online: 32,
    imageUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBTLsdSbHiMSVoNu3p-uYpi3ztwYMsJ7M43CKns4oVWiKSOltlCNleAcLdGXuggJMxtapvIfCHNiHO69ZeQBjpv46gC_WU2MbG3k9HXmF0jiDuKXlt7MtP6GFw6KycQonKVjsWrUHAyF4_aeIm0qWIzsTw2EN8PBHH0uDvWbpWnQnwFpYbtHRyhAZ6N6m1aUXyakJBa8yCiphOpO58c2tHJBmLHXDK8h_8OtV3ManFjU35uvfC6NfMXgQ',
  },
];

function CommunityCard({ community, onPress }: { community: Community; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        gap: 12,
        backgroundColor: COLORS.surfaceContainer,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(158,143,120,0.3)',
        alignItems: 'center',
      }}>
      <Image source={{ uri: community.imageUri }} style={{ width: 56, height: 56, borderRadius: 12 }} resizeMode="cover" />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: 16 }}>
          {community.name}
        </Text>
        <Text numberOfLines={2} style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: 12 }}>
          {community.description}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' }} />
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: 11 }}>
              {community.online} online
            </Text>
          </View>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: 11 }}>
            {community.members} membros
          </Text>
        </View>
      </View>
      {community.joined ? (
        <MaterialIcons name="chevron-right" size={22} color={COLORS.onSurfaceVariant} />
      ) : (
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: COLORS.primary,
          }}>
          <Text style={{ color: COLORS.onPrimary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 12 }}>
            Entrar
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function ComunidadeScreen() {
  const router = useRouter();
  const fontsLoaded = useAppFonts();
  const [tab, setTab] = useState<'minhas' | 'descobrir'>('minhas');
  const [busca, setBusca] = useState('');

  if (!fontsLoaded) return null;

  const list = COMMUNITIES.filter((c) => (tab === 'minhas' ? c.joined : !c.joined));
  const openChat = (c: Community) => router.push(`/comunidade/${c.id}` as any);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View
        style={{
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottomWidth: 2,
          borderBottomColor: 'rgba(255,220,161,0.2)',
        }}>
        <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: 22 }}>Comunidade</Text>
      </View>

      <View style={{ padding: 16, gap: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: COLORS.surfaceContainerLowest,
            borderWidth: 1,
            borderColor: COLORS.outlineVariant,
            borderRadius: 8,
            paddingHorizontal: 12,
            height: 44,
          }}>
          <MaterialIcons name="search" size={20} color={COLORS.onSurfaceVariant} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Digite algo..."
            placeholderTextColor="rgba(213,196,171,0.5)"
            style={{ flex: 1, color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: 14 }}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => setTab('minhas')}
            style={{
              flex: 1,
              minHeight: 40,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: tab === 'minhas' ? COLORS.primaryContainer : COLORS.surfaceContainer,
            }}>
            <Text
              style={{
                fontFamily: 'AtkinsonHyperlegible_700Bold',
                fontSize: 13,
                color: tab === 'minhas' ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant,
              }}>
              Minhas Comunidades
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('descobrir')}
            style={{
              flex: 1,
              minHeight: 40,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: tab === 'descobrir' ? COLORS.primaryContainer : COLORS.surfaceContainer,
            }}>
            <Text
              style={{
                fontFamily: 'AtkinsonHyperlegible_700Bold',
                fontSize: 13,
                color: tab === 'descobrir' ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant,
              }}>
              Descubra
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 24 }}>
        {list.map((c) => (
          <CommunityCard key={c.id} community={c} onPress={() => openChat(c)} />
        ))}
        {list.length === 0 && (
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: 14, textAlign: 'center', marginTop: 24 }}>
            Nada por aqui ainda.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
