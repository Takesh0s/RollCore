// MinhasMesasScreen.tsx — RollCore
//
// Reconstrução em flexbox do export do Stitch (minhas_mesas/code.html).
// Tela raiz pós-login: lista as mesas do usuário, com FAB para criar nova.

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, BottomNavBar, useAppFonts } from '../design/shared';

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
              fontSize: 12,
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
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 11 }}>
            {campaign.system}
          </Text>
        </View>
        <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: 20 }}>
          {campaign.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <MaterialIcons name="calendar-month" size={18} color={COLORS.onSurfaceVariant} />
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: 14 }}>
            {campaign.nextSession}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function MinhasMesasScreen() {
  const router = useRouter();
  const fontsLoaded = useAppFonts();

  if (!fontsLoaded) return null;

  const goToSettings = () => router.push('/configuracoes');
  const goToNovaMesa = () => router.push('/mesa');
  const goToMesa = (_campaign: Campaign) => {
    // TODO: criar rota de Perfil da Mesa — ainda não codificada.
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View
        style={{
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          borderBottomWidth: 2,
          borderBottomColor: 'rgba(255,220,161,0.2)',
          backgroundColor: COLORS.surfaceContainerHigh,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable onPress={() => router.push('/livraria')} accessibilityLabel="Menu" style={{ padding: 8 }}>
            <MaterialIcons name="menu" size={24} color={COLORS.primary} />
          </Pressable>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: COLORS.primary,
              overflow: 'hidden',
              backgroundColor: COLORS.surfaceContainerHighest,
            }}
          />
          <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_600SemiBold', fontSize: 22 }}>
            Minhas Mesas
          </Text>
        </View>
        <Pressable onPress={goToSettings} accessibilityLabel="Configurações" style={{ padding: 8 }}>
          <MaterialIcons name="settings" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {CAMPAIGNS.map((c) => (
          <CampaignCard key={c.id} campaign={c} onPress={() => goToMesa(c)} />
        ))}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={goToNovaMesa}
        accessibilityLabel="Criar Nova Mesa"
        style={{
          position: 'absolute',
          right: 16,
          bottom: 88,
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

      <BottomNavBar active="dashboard" onNavigate={(route) => router.push(route as any)} />
    </SafeAreaView>
  );
}
