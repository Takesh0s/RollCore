import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Card, Divider, Header } from '../design/shared';

interface Rolagem {
  id: string;
  dado: string;
  resultado: number;
}

const DADOS = [4, 6, 8, 10, 12, 20, 100];

export default function DadosScreen() {
  const router = useRouter();
  const [ultimoResultado, setUltimoResultado] = useState<number | null>(null);
  const [ultimoDado, setUltimoDado] = useState<number | null>(null);
  const [historico, setHistorico] = useState<Rolagem[]>([]);

  const rolar = (faces: number) => {
    const resultado = Math.floor(Math.random() * faces) + 1;
    setUltimoResultado(resultado);
    setUltimoDado(faces);
    setHistorico((prev) => [
      { id: `${Date.now()}`, dado: `d${faces}`, resultado },
      ...prev,
    ].slice(0, 8));
  };

  const critico = ultimoDado === 20 && ultimoResultado === 20;
  const falhaCritica = ultimoDado === 20 && ultimoResultado === 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Dados" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>

        <View style={{ alignItems: 'center', gap: 4, paddingVertical: 16 }}>
          <Text
            style={{
              fontSize: 72,
              fontFamily: 'SourceSerif4_700Bold',
              color: critico ? '#4ADE80' : falhaCritica ? '#F87171' : COLORS.primary,
            }}
          >
            {ultimoResultado ?? '–'}
          </Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: 14 }}>
            {ultimoDado ? `d${ultimoDado}` : 'Escolha um dado abaixo'}
          </Text>
          {critico && (
            <Text style={{ color: '#4ADE80', fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 13 }}>
              ACERTO CRÍTICO!
            </Text>
          )}
          {falhaCritica && (
            <Text style={{ color: '#F87171', fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 13 }}>
              FALHA CRÍTICA!
            </Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {DADOS.map((faces) => (
            <Pressable
              key={faces}
              onPress={() => rolar(faces)}
              style={{
                width: 78, height: 78, borderRadius: 12,
                borderWidth: 2, borderColor: COLORS.primary,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: COLORS.surfaceContainer,
              }}
            >
              <MaterialIcons name="casino" size={20} color={COLORS.primary} />
              <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 16, marginTop: 4 }}>
                d{faces}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: COLORS.primary, fontSize: 18, fontFamily: 'SourceSerif4_700Bold' }}>
            Histórico
          </Text>

          {historico.length === 0 ? (
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular' }}>
              Nenhuma rolagem ainda.
            </Text>
          ) : (
            <Card>
              {historico.map((r, i) => (
                <View key={r.id}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
                    <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>
                      {r.dado}
                    </Text>
                    <Text style={{ color: COLORS.secondary, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>
                      {r.resultado}
                    </Text>
                  </View>
                  {i < historico.length - 1 && <Divider />}
                </View>
              ))}
            </Card>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}