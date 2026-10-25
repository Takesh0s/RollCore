import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { AccessibleText as Text, AccessibleTextInput as TextInput, AccessiblePressable as Pressable } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Header, PrimaryButton } from '../design/shared';
import { useSessaoAoVivo } from '../services/liveSession';
import type { StompStatus } from '../services/stomp';
import { carregarDetalhe, getMesaById, useMesas } from '../store/mesas';

const DADOS = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

const STATUS_TEXTO: Record<StompStatus, string> = {
  connecting: 'Conectando…',
  connected: 'Ao vivo',
  reconnecting: 'Reconectando…',
  closed: 'Desconectado',
};

export default function SessaoAtivaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  useMesas(); // re-render when the invite code arrives
  const mesa = getMesaById(id);
  const { status, rolagens, online, erro, rolar } = useSessaoAoVivo(mesa ? id : undefined);
  const [formula, setFormula] = useState('1d20');
  useEffect(() => { if (id) carregarDetalhe(id).catch(() => undefined); }, [id]);

  if (!mesa) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Header title="Mesa" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: COLORS.onSurfaceVariant }}>Mesa não encontrada.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title={mesa.titulo} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialIcons name="casino" size={20} color={COLORS.primary} />
          <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>{mesa.sistema}</Text>
          <Text style={{ color: COLORS.onSurfaceVariant, marginLeft: 8 }}>· {mesa.papel}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialIcons name="event" size={18} color={COLORS.onSurfaceVariant} />
          <Text style={{ color: COLORS.secondary }}>Próxima Sessão: {mesa.proximaSessao}</Text>
        </View>

        {mesa.codigoConvite ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons name="vpn-key" size={18} color={COLORS.onSurfaceVariant} />
            <Text selectable style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', letterSpacing: 2 }}>Código de convite: {mesa.codigoConvite}</Text>
          </View>
        ) : null}

        {mesa.descricao ? (
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', lineHeight: 20 }}>
            {mesa.descricao}
          </Text>
        ) : null}

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons name="circle" size={12} color={status === 'connected' ? '#4caf50' : COLORS.onSurfaceVariant} />
            <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>{STATUS_TEXTO[status]}</Text>
          </View>
          <Text style={{ color: COLORS.onSurfaceVariant }}>
            {online.length > 0 ? `Online: ${online.map((m) => m.username).join(', ')}` : 'Ninguém online.'}
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DADOS.map((d) => (
              <Pressable
                key={d}
                accessibilityRole="button"
                accessibilityLabel={`Rolar 1${d}`}
                onPress={() => rolar(`1${d}`)}
                style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: COLORS.surfaceContainerHigh ?? COLORS.background, borderWidth: 1, borderColor: COLORS.primary }}
              >
                <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>{d}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput
              value={formula}
              onChangeText={setFormula}
              placeholder="2d6+3"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => rolar(formula)}
              style={{ flex: 1, color: COLORS.onSurface, borderWidth: 1, borderColor: COLORS.onSurfaceVariant, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
            />
            <PrimaryButton title="Rolar" icon="casino" onPress={() => rolar(formula)} />
          </View>
          {erro ? <Text style={{ color: '#e57373' }}>{erro}</Text> : null}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>Rolagens da mesa</Text>
          {rolagens.length === 0 ? (
            <Text style={{ color: COLORS.onSurfaceVariant }}>Nenhuma rolagem ainda.</Text>
          ) : rolagens.map((r) => (
            <View key={r.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.onSurfaceVariant + '33' }}>
              <Text style={{ color: COLORS.onSurface }}>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible_700Bold' }}>{r.displayName || r.username}</Text> rolou {r.formula}
              </Text>
              <Text style={{ color: COLORS.onSurfaceVariant }}>
                [{r.rolls.join(', ')}]{r.mod ? ` ${r.mod > 0 ? '+' : '−'} ${Math.abs(r.mod)}` : ''} = <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold' }}>{r.total}</Text>
              </Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 8, gap: 12 }}>
          <PrimaryButton title="Ver Ficha de Personagem" icon="badge" onPress={() => router.push('/personagens')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
