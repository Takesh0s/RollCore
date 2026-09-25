import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Field, Header, PrimaryButton, useAppFonts } from '../design/shared';
import { ATRIBUTOS_BASE, modificador, setPersonagem } from '../store/personagem';

export default function CriarPersonagemScreen() {
  const router = useRouter();
  const fontsLoaded = useAppFonts();

  const [nome, setNome] = useState('');
  const [classe, setClasse] = useState('');
  const [nivel, setNivel] = useState('1');
  const [valores, setValores] = useState<Record<string, number>>(
    ATRIBUTOS_BASE.reduce((acc, a) => ({ ...acc, [a.key]: 10 }), {} as Record<string, number>)
  );

  if (!fontsLoaded) return null;

  const ajustar = (key: string, delta: number) => {
    setValores((prev) => ({
      ...prev,
      [key]: Math.max(1, Math.min(20, prev[key] + delta)),
    }));
  };

  const criar = () => {
    if (!nome.trim()) return;
    setPersonagem({
      nome: nome.trim(),
      classe: classe.trim() || 'Aventureiro',
      nivel: Math.max(1, parseInt(nivel, 10) || 1),
      valores,
    });
    router.push('/personagens');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Criar Personagem" onBack={() => router.back()} rightIcon="person" />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        <Field label="Nome do Personagem" placeholder="Ex: Valerius" value={nome} onChangeText={setNome} />
        <Field label="Classe" placeholder="Ex: Paladino" value={classe} onChangeText={setClasse} />
        <Field
          label="Nível"
          placeholder="1"
          value={nivel}
          onChangeText={setNivel}
          keyboardType="number-pad"
        />

        <View style={{ gap: 12 }}>
          <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 14 }}>
            Atributos
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
            {ATRIBUTOS_BASE.map((attr) => (
              <View
                key={attr.key}
                style={{
                  width: '47%',
                  backgroundColor: COLORS.surfaceContainer,
                  borderRadius: 12,
                  padding: 12,
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 11 }}>
                  {attr.label}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Pressable onPress={() => ajustar(attr.key, -1)} style={{ padding: 6 }}>
                    <MaterialIcons name="remove-circle-outline" size={22} color={COLORS.primary} />
                  </Pressable>
                  <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: 22, minWidth: 32, textAlign: 'center' }}>
                    {valores[attr.key]}
                  </Text>
                  <Pressable onPress={() => ajustar(attr.key, 1)} style={{ padding: 6 }}>
                    <MaterialIcons name="add-circle-outline" size={22} color={COLORS.primary} />
                  </Pressable>
                </View>
                <Text style={{ color: COLORS.secondary, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: 12 }}>
                  Mod: {modificador(valores[attr.key]) >= 0 ? '+' : ''}{modificador(valores[attr.key])}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <PrimaryButton title="Criar Personagem" icon="check-circle" onPress={criar} />
      </ScrollView>
    </SafeAreaView>
  );
}