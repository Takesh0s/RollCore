import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNavBar, COLORS, useAppFonts } from '../design/shared';
import { ATRIBUTOS_BASE, modificador, usePersonagem } from '../store/personagem';

function AttributeCard({
  label,
  icon,
  value,
  modifier,
  onRoll,
  result,
}: {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  value: number;
  modifier: number;
  onRoll: () => void;
  result: number | null;
}) {
  return (
    <View
      style={{
        width: '47%',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderTopWidth: 2,
        borderTopColor: modifier >= 2 ? COLORS.primary : COLORS.outlineVariant,
        overflow: 'hidden',
      }}>
      <Text
        style={{
          color: COLORS.onSurfaceVariant,
          fontFamily: 'AtkinsonHyperlegible_700Bold',
          fontSize: 12,
          letterSpacing: 1.5,
          marginBottom: 8,
        }}>
        {label}
      </Text>
      <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: 40 }}>
        {modifier >= 0 ? `+${modifier}` : modifier}
      </Text>
      <View
        style={{
          backgroundColor: COLORS.surfaceContainer,
          borderWidth: 1,
          borderColor: COLORS.outlineVariant,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 3,
          marginTop: 6,
          marginBottom: 12,
        }}>
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 11 }}>
          Valor: {value}
        </Text>
      </View>

      {result !== null && (
        <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 13, marginBottom: 8 }}>
          Resultado: {result}
        </Text>
      )}

      <Pressable
        onPress={onRoll}
        style={{
          width: '100%',
          minHeight: 44,
          backgroundColor: COLORS.primary,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}>
        <MaterialIcons name="casino" size={18} color={COLORS.onPrimary} />
        <Text style={{ color: COLORS.onPrimary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 14 }}>Rolar</Text>
      </Pressable>
    </View>
  );
}

export default function FichaAtributosScreen() {
  const router = useRouter();
  const fontsLoaded = useAppFonts();
  const personagem = usePersonagem();
  const [results, setResults] = useState<Record<string, number | null>>({});

  if (!fontsLoaded) return null;

  const rollAttribute = (key: string, modifier: number) => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    setResults((prev) => ({ ...prev, [key]: d20 + modifier }));
  };

  const goToSettings = () => router.push('/configuracoes');
  const primeiro = ATRIBUTOS_BASE[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: COLORS.primary,
              backgroundColor: COLORS.surfaceContainerHighest,
            }}
          />
          <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: 20, textTransform: 'uppercase' }}>
            RollCore
          </Text>
        </View>
        <Pressable onPress={goToSettings} accessibilityLabel="Configurações" style={{ padding: 8 }}>
          <MaterialIcons name="settings" size={22} color={COLORS.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: 24 }}>
            {personagem.nome}
          </Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: 16 }}>
            Level {personagem.nivel} {personagem.classe}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
          {ATRIBUTOS_BASE.map((attr) => {
            const value = personagem.valores[attr.key] ?? 10;
            const modifier = modificador(value);
            return (
              <AttributeCard
                key={attr.key}
                label={attr.label}
                icon={attr.icon}
                value={value}
                modifier={modifier}
                result={results[attr.key] ?? null}
                onRoll={() => rollAttribute(attr.key, modifier)}
              />
            );
          })}
        </View>
      </ScrollView>

      <BottomNavBar active="skills" onNavigate={(route) => router.push(route as any)} />
    </SafeAreaView>
  );
}