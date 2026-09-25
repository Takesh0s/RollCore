// LivrariaScreen.tsx — RollCore
//
// Reconstrução em flexbox do export do Stitch
// (livraria_marketplace_de_campanhas/code.html). Tem sua própria barra
// inferior (Market/Library/Publish/Profile), separada da barra
// Dashboard/Dice/Skills/Vault do app principal — por isso não usa o
// grupo (tabs), é uma tela solta com nav própria desenhada.

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, useAppFonts } from '../design/shared';

interface Item {
  id: string;
  title: string;
  author: string;
  rating: number;
  price: string; // "Grátis" ou "R$ 25,00"
  imageUri: string;
  hasDetail?: boolean;
}

const ITEMS: Item[] = [
  {
    id: 'sussurros',
    title: 'Sussurros do Abismo',
    author: 'por Mestre Alistair',
    rating: 4.8,
    price: 'R$ 25,00',
    imageUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAyGRGsbS6oONbAm6MN62__orabCN4R8SYkgK1MW5wbV1quEorWtHc3h-YSVElHqwAk4b2Z-2Kx4l7GIT3tqUmgVKC5QxdEJRSpDTKJM_tMYV8vbJseX8k2bkhlNGkxmEfzzqzpD2yUfH76S3rN1ik2cJ5OESwGyhqqpqasHqEb1-weLctilx-r-YG9zQbnO3vb412dfKsQGgbQvU60S0YygEDw1cUaHXGDmhukeP3tt3YKqRIr3DjRbg',
  },
  {
    id: 'floral-dragons',
    title: 'Floral Dragons',
    author: 'por Elara Ventosul',
    rating: 4.9,
    price: 'Grátis',
    hasDetail: true,
    imageUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCWZFiC5LkXFDApFv_2__1AVHR3HAEQ62xdK3_qvfml591AbsliGPvX88KX3B2ycJwkxfppUmj42GD76Gi2fS8XiAOYsWSJZXR5jZhcSAcEtb0vmi8a9jOMQcyoxjaAe6r9blJFQ_FrSn2ig4hPc0CxIS-VK3QyS6EcCRdUK6IY9pEgEMe4AH-3Aa5_j0mrhkdCPTmEWNmnncVJgV77Uy8QPJEst4m9ocmKV0xUdBXvbRMc7MDsElsLRw',
  },
  {
    id: 'cidadela',
    title: 'A Cidadela em Ruínas',
    author: 'por Crônicas de Ferro',
    rating: 4.5,
    price: 'R$ 15,90',
    imageUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCUtMA0kgveeuCsBPdWpwaLLvFWtTIaZZPdw4FsVvO1kvqjKveWyYELsFzQb4GminmKdyyP7B3gZXIHG8hEKMzeR49r0kQlY6ZxLyKdr__xsI7QMt3iz2JOAXiTO0M899W6I6yU-BXA7-7ObVeOnVK8qs8FULxHJc4VCQMIIR_x-cOOBZ_9xaIAvVehwY85guebZdAwC7bHwnNK2_j9KUuoQEVL3zTaJrfhqxmO8e2mX9FIFitZ2w5PsQ',
  },
];

const CATEGORIES = ['Gratuitas', 'Mais vendidas', 'Novidades', 'D&D 5e', 'Pathfinder'];

function ItemCard({ item, onPress }: { item: Item; onPress: () => void }) {
  const isFree = item.price === 'Grátis';
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: COLORS.surfaceContainer,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.outlineVariant,
        borderTopWidth: 2,
        borderTopColor: COLORS.primaryContainer,
      }}>
      <Image source={{ uri: item.imageUri }} style={{ width: '100%', height: 110 }} resizeMode="cover" />
      <View style={{ padding: 12, gap: 6 }}>
        <Text
          numberOfLines={2}
          style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: 15 }}>
          {item.title}
        </Text>
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: 12 }}>
          {item.author}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 4,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: COLORS.surfaceContainerHighest,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name="star" size={14} color={COLORS.primary} />
            <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 13 }}>
              {item.rating}
            </Text>
          </View>
          <Text
            style={{
              color: isFree ? COLORS.onPrimary : COLORS.primary,
              backgroundColor: isFree ? COLORS.primary : 'transparent',
              fontFamily: 'AtkinsonHyperlegible_700Bold',
              fontSize: 12,
              paddingHorizontal: isFree ? 8 : 0,
              paddingVertical: isFree ? 2 : 0,
              borderRadius: 4,
            }}>
            {item.price}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function BottomTab({
  icon,
  label,
  active,
  filled,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  active?: boolean;
  filled?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        paddingHorizontal: active ? 16 : 8,
        paddingVertical: active ? 6 : 0,
        borderRadius: 999,
        backgroundColor: active ? COLORS.primaryContainer : 'transparent',
      }}>
      <MaterialIcons name={icon} size={22} color={active ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant} />
      <Text
        style={{
          fontFamily: 'AtkinsonHyperlegible_700Bold',
          fontSize: 11,
          color: active ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function LivrariaScreen() {
  const router = useRouter();
  const fontsLoaded = useAppFonts();
  if (!fontsLoaded) return null;

  const goBack = () => router.back();
  const openItem = (item: Item) => {
    if (item.hasDetail) router.push(`/campanha/${item.id}`);
    // demais itens ainda não têm tela de detalhe própria
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
          paddingHorizontal: 8,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.outlineVariant,
        }}>
        <Pressable onPress={goBack} accessibilityLabel="Voltar" style={{ padding: 12 }}>
          <MaterialIcons name="arrow-back" size={22} color={COLORS.primary} />
        </Pressable>
        <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: 22 }}>Livraria</Text>
        <Pressable accessibilityLabel="Buscar" style={{ padding: 12 }}>
          <MaterialIcons name="search" size={22} color={COLORS.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingVertical: 16 }}>
        {/* Categorias */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 20 }}>
          {CATEGORIES.map((cat, i) => (
            <View
              key={cat}
              style={{
                paddingHorizontal: 16,
                height: 40,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: i === 0 ? COLORS.primaryContainer : COLORS.surfaceContainer,
                borderWidth: 1,
                borderColor: i === 0 ? COLORS.primaryContainer : COLORS.outlineVariant,
              }}>
              <Text
                style={{
                  fontFamily: 'AtkinsonHyperlegible_700Bold',
                  fontSize: 13,
                  color: i === 0 ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant,
                }}>
                {cat}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Grid de itens */}
        <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {ITEMS.map((item) => (
            <View key={item.id} style={{ width: '47%' }}>
              <ItemCard item={item} onPress={() => openItem(item)} />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom nav própria da Livraria */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          height: 72,
          borderTopWidth: 1,
          borderTopColor: COLORS.outlineVariant,
          backgroundColor: COLORS.surfaceContainerLowest,
        }}>
        <BottomTab icon="storefront" label="Market" />
        <BottomTab icon="auto-stories" label="Library" active filled />
        <BottomTab icon="add-circle" label="Publish" />
        <BottomTab icon="person" label="Profile" />
      </View>
    </SafeAreaView>
  );
}
