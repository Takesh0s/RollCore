import { useAcessibilidade } from '../store/acessibilidade';
// MinhasMesasScreen.tsx — RollCore
//
// Reconstrução em flexbox do export do Stitch (minhas_mesas/code.html).
// Tela raiz pós-login: lista as mesas do usuário, com FAB para criar nova.
// Cabeçalho no padrão do Figma (hambúrguer + título + perfil) e busca por nome.

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable as NativePressable, ScrollView, Text as NativeText, TextInput as NativeTextInput, View } from 'react-native';
import { AccessibleText as Text, AccessibleTextInput as TextInput, AccessiblePressable as Pressable } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { COLORS, useAppFonts, appFontSize } from '../design/shared';

interface Campaign {
  id: string;
  title: string;
  system: string;
  role: 'Mestre' | 'Jogador';
  nextSession: string;
  imageUri: string;
}

const CAMPAIGNS: Campaign[] = [
  {
    id: 'strahd',
    title: 'A Maldição de Strahd',
    system: 'D&D 5e',
    role: 'Mestre',
    nextSession: 'Próxima Sessão: Sábado, 20h',
    imageUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD0QJzoailqXRucEkipJju_1KNsEjPvsB4A5em7pd30adzbsQ_lCHq6ANuX964zpnysn5suxi2Gx8jNHsJGCFmIQljHgpbyArmqTjstxI7gaeC0L9C5Pe9CC1TP3qzP5uT9w1cED47VfEX6o8fpz7X2dWgMDHHtqIgKoMOE2YpYplGraTOQs7p6Zz4V0OszoS2grsD6UjqaWtTajH6CIahtKj94iYXKm1LQC4SQlF0FWvsF8qc_Eo68Xw',
  },
  {
    id: 'arkham',
    title: 'Sombras de Arkham',
    system: 'Chamado de Cthulhu',
    role: 'Jogador',
    nextSession: 'Próxima Sessão: Domingo, 15h',
    imageUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBG_D6mDWpzHXRzjggVjLUL5JdU_RNPkTvCE4QCpLuuLz59xr7YeMTOiw6m8HH3viawqVoPO6bV_K7U37Ww-uA600QxWxPZ8zb6NF_Q0cXgUUjse0dwDQXbqDfYQ-_bNI5PP9R-0dH4B_S4gPRrRa-d37s0lNufm2UkJVDwxYLyfW69-ee_NbuHT7I9TjZh6nkdGhYdEVUJkOmn72AdL__hcMyNPvbi7jbgRBCqvnWMq9pv6RUcz1nmow',
  },
];

function CampaignCard({ campaign, onPress }: { campaign: Campaign; onPress: () => void }) {
  const isMestre = campaign.role === 'Mestre';
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: COLORS.surfaceContainerHigh,
        borderWidth: 1,
        borderColor: COLORS.surfaceContainerHighest,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
      }}>
      <View style={{ height: 128, width: '100%' }}>
        <Image source={{ uri: campaign.imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: isMestre ? COLORS.primary : COLORS.surfaceContainerHighest,
            borderWidth: isMestre ? 0 : 1,
            borderColor: COLORS.outlineVariant,
          }}>
          <MaterialIcons
            name={isMestre ? 'construction' : 'person'}
            size={14}
            color={isMestre ? COLORS.onPrimary : COLORS.onSurfaceVariant}
          />
          <Text
            style={{
              fontFamily: 'AtkinsonHyperlegible_700Bold',
              fontSize: appFontSize(12),
              color: isMestre ? COLORS.onPrimary : COLORS.onSurfaceVariant,
            }}>
            {campaign.role}
          </Text>
        </View>
      </View>

      <View style={{ padding: 16, gap: 8 }}>
        <View
          style={{
            alignSelf: 'flex-start',
            borderWidth: 1,
            borderColor: COLORS.outlineVariant,
            borderRadius: 4,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(11) }}>
            {campaign.system}
          </Text>
        </View>
        <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(20) }}>
          {campaign.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <MaterialIcons name="calendar-month" size={18} color={COLORS.onSurfaceVariant} />
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14) }}>
            {campaign.nextSession}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function MinhasMesasScreen() {
  useAcessibilidade();
  const router = useRouter();
  const fontsLoaded = useAppFonts();
  const [busca, setBusca] = useState('');

  if (!fontsLoaded) return null;

  const goToNovaMesa = () => router.push('/mesa');
  const goToMesa = (campaign: Campaign) => router.push(`/sessao/${campaign.id}` as any);

  const termo = busca.trim().toLowerCase();
  const campanhas = termo
    ? CAMPAIGNS.filter((c) => c.title.toLowerCase().includes(termo) || c.system.toLowerCase().includes(termo))
    : CAMPAIGNS;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Minhas Mesas" />

      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {/* Busca (Figma: lupa no topo da lista de mesas) */}
        <View style={{ marginBottom: 16, justifyContent: 'center' }}>
          <MaterialIcons
            name="search"
            size={20}
            color={COLORS.onSurfaceVariant}
            style={{ position: 'absolute', left: 14, zIndex: 1 }}
          />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar mesa"
            placeholderTextColor="rgba(192,192,192,0.5)"
            accessibilityLabel="Buscar mesa"
            style={{
              minHeight: 44,
              backgroundColor: COLORS.surfaceContainerHighest,
              borderWidth: 1,
              borderColor: COLORS.outlineVariant,
              borderRadius: 8,
              paddingLeft: 42,
              paddingRight: 12,
              color: COLORS.onSurface,
              fontFamily: 'AtkinsonHyperlegible_400Regular',
              fontSize: appFontSize(15),
            }}
          />
        </View>

        {campanhas.map((c) => (
          <CampaignCard key={c.id} campaign={c} onPress={() => goToMesa(c)} />
        ))}
        {campanhas.length === 0 && (
          <Text
            style={{
              color: COLORS.onSurfaceVariant,
              fontFamily: 'AtkinsonHyperlegible_400Regular',
              fontSize: appFontSize(15),
              textAlign: 'center',
              marginTop: 24,
            }}>
            Nenhuma mesa encontrada.
          </Text>
        )}
        {/* Espaço para o FAB não cobrir o último card */}
        <View style={{ height: 72 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={goToNovaMesa}
        accessibilityLabel="Criar Nova Mesa"
        style={{
          position: 'absolute',
          right: 16,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: COLORS.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.4,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 8,
        }}>
        <MaterialIcons name="add" size={28} color={COLORS.onPrimary} />
      </Pressable>
    </SafeAreaView>
  );
}
