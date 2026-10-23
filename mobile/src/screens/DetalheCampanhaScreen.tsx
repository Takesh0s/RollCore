import { useAcessibilidade } from '../store/acessibilidade';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Modal, Pressable as NativePressable, ScrollView, Text as NativeText, View } from 'react-native';
import { AccessibleText as Text, AccessiblePressable as Pressable } from '../components/accessible-text';
import { useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, useAppFonts, appFontSize } from '../design/shared';
import { getProdutoById } from '../store/produtos';


const REVIEWS = [
  { name: 'Mestre_Zoltan', stars: 5, text: 'Referência essencial pra qualquer mesa. Recomendo muito!' },
  { name: 'Lya_Ranger', stars: 4, text: 'Conteúdo denso e bem organizado, vale cada centavo.' },
];

function Stars({ count }: { count: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <MaterialIcons key={i} name="star" size={14} color={i < count ? COLORS.primaryContainer : COLORS.outlineVariant} />
      ))}
    </View>
  );
}

export default function DetalheCampanhaScreen() {
  useAcessibilidade();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const fontsLoaded = useAppFonts();
  const insets = useSafeAreaInsets();
  const [checkoutInfoVisible, setCheckoutInfoVisible] = useState(false);
  const produto = getProdutoById(id);

  if (!fontsLoaded) return null;

  const goBack = () => router.back();

  if (!produto) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: COLORS.onSurfaceVariant }}>Produto não encontrado.</Text>
        <Pressable onPress={goBack} style={{ marginTop: 16 }}>
          <Text style={{ color: COLORS.primary }}>Voltar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 8,
        }}>
        <Pressable onPress={goBack} accessibilityLabel="Voltar" style={{ padding: 12 }}>
          <MaterialIcons name="arrow-back" size={22} color={COLORS.primary} />
        </Pressable>
        <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(18) }}>
          {produto.titulo}
        </Text>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 6,
            backgroundColor: COLORS.surfaceContainer,
            borderWidth: 1,
            borderColor: 'rgba(192,192,192,0.2)',
          }}>
          <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13) }}>
            {produto.preco}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        <View style={{ height: 220, width: '100%' }}>
          <Image source={{ uri: produto.imagemUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>

        <View style={{ padding: 16, gap: 24 }}>
          {/* Badges */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: 'rgba(192,192,192,0.3)' }}>
              <MaterialIcons name="casino" size={16} color={COLORS.primary} />
              <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(12) }}>{produto.categoria}</Text>
            </View>
          </View>

          {/* Sinopse */}
          <View style={{ backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 16, borderTopWidth: 2, borderTopColor: COLORS.primaryContainer, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="auto-stories" size={20} color={COLORS.primaryContainer} />
              <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(18) }}>Sinopse</Text>
            </View>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(15), lineHeight: 22 }}>
              {produto.sinopse}
            </Text>
          </View>

          {/* Destaques */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="lock-open" size={20} color={COLORS.secondary} />
              <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(18) }}>
                Esta compra desbloqueia
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {produto.destaques.map((d) => (
                <View
                  key={d.label}
                  style={{
                    width: '47%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: COLORS.surfaceContainer,
                    borderRadius: 8,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: COLORS.surfaceContainerHighest,
                  }}>
                  <MaterialIcons name={d.icon} size={20} color={COLORS.secondary} />
                  <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(13), flexShrink: 1 }}>
                    {d.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sumário */}
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="list" size={20} color={COLORS.primary} />
              <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(18) }}>Sumário</Text>
            </View>
            {produto.conteudo.map((ch) => (
              <View key={ch} style={{ backgroundColor: COLORS.surfaceContainer, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(192,192,192,0.2)' }}>
                <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>{ch}</Text>
              </View>
            ))}
          </View>

          {/* Avaliações */}
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(18) }}>Avaliações</Text>
              <Stars count={4} />
            </View>
            {REVIEWS.map((r) => (
              <View key={r.name} style={{ backgroundColor: COLORS.surfaceContainer, borderRadius: 8, padding: 12, gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13) }}>{r.name}</Text>
                  <Stars count={r.stars} />
                </View>
                <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(13), fontStyle: 'italic' }}>
                  "{r.text}"
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Botão fixo de compra */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          paddingBottom: 16 + insets.bottom,
          backgroundColor: 'rgba(53,56,57,0.92)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(192,192,192,0.2)',
        }}>
        <Pressable
          onPress={() => setCheckoutInfoVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Comprar ${produto.titulo}, checkout ainda indisponível`}
          style={{
            minHeight: 48,
            backgroundColor: COLORS.primaryContainer,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}>
          <Text style={{ color: COLORS.onPrimaryContainer, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15), textTransform: 'uppercase' }}>
            Comprar
          </Text>
          <View style={{ borderLeftWidth: 1, borderLeftColor: 'rgba(192,192,192,0.3)', paddingLeft: 10 }}>
            <Text style={{ color: COLORS.onPrimaryContainer, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>
              {produto.preco}
            </Text>
          </View>
        </Pressable>
      </View>

      <Modal visible={checkoutInfoVisible} transparent animationType="fade" onRequestClose={() => setCheckoutInfoVisible(false)}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.65)' }}>
          <View style={{ width: '100%', maxWidth: 420, padding: 20, gap: 12, borderRadius: 16, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
            <MaterialIcons name="info-outline" size={30} color={COLORS.primary} style={{ alignSelf: 'center' }} />
            <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(20), textAlign: 'center' }}>Checkout indisponível</Text>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14), lineHeight: 20, textAlign: 'center' }}>
              A compra de produtos ainda não está conectada. Nenhum pagamento foi iniciado.
            </Text>
            <Pressable onPress={() => setCheckoutInfoVisible(false)} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: COLORS.primary }}>
              <Text style={{ color: COLORS.onPrimary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>Entendi</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
