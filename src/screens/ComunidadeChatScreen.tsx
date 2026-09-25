// ComunidadeChatScreen.tsx — RollCore
//
// Chat de uma comunidade específica, com botão para expandir/recolher a
// lista de participantes (igual à referência do Figma: "chat aberto com
// aba de participantes expandida").

import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, useAppFonts } from '../design/shared';

interface Message {
  id: string;
  author: string;
  text: string;
  system?: boolean;
}

const MESSAGES: Message[] = [
  { id: 'm1', author: '', text: 'Valerius the Bold entrou na comunidade.', system: true },
  { id: 'm2', author: 'Elowen', text: 'Bem-vindo, Valerius! Sinta-se em casa por aqui.' },
  { id: 'm3', author: 'Você', text: 'Obrigado! Ansioso pra próxima sessão de sábado.' },
  { id: 'm4', author: 'Thorin_GM', text: 'Alguém tem dica de item mágico pra nível 5? Preciso equilibrar o loot.' },
  { id: 'm5', author: 'Elowen', text: 'Uma poção de cura maior costuma resolver bem nessa fase.' },
];

const PARTICIPANTS = [
  { name: 'Thorin_GM', role: 'Mestre', online: true },
  { name: 'Elowen', role: 'Jogadora', online: true },
  { name: 'Você', role: 'Jogador', online: true },
  { name: 'Bramblewick', role: 'Jogador', online: false },
];

function Bubble({ msg }: { msg: Message }) {
  if (msg.system) {
    return (
      <Text
        style={{
          alignSelf: 'center',
          color: COLORS.onSurfaceVariant,
          fontFamily: 'AtkinsonHyperlegible_400Regular',
          fontSize: 12,
          fontStyle: 'italic',
          marginVertical: 4,
        }}>
        {msg.text}
      </Text>
    );
  }
  const isMe = msg.author === 'Você';
  return (
    <View style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%', marginVertical: 4 }}>
      {!isMe && (
        <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 12, marginBottom: 2 }}>
          {msg.author}
        </Text>
      )}
      <View
        style={{
          backgroundColor: isMe ? COLORS.primaryContainer : COLORS.surfaceContainerHigh,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}>
        <Text
          style={{
            color: isMe ? COLORS.onPrimaryContainer : COLORS.onSurface,
            fontFamily: 'AtkinsonHyperlegible_400Regular',
            fontSize: 14,
          }}>
          {msg.text}
        </Text>
      </View>
    </View>
  );
}

export default function ComunidadeChatScreen() {
  const router = useRouter();
  const fontsLoaded = useAppFonts();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [showParticipants, setShowParticipants] = useState(false);
  const [texto, setTexto] = useState('');

  if (!fontsLoaded) return null;

  const goBack = () => router.back();
  const nomeComunidade =
    id === 'floral-dragons' ? 'Clã do Dragão Floral' : id === 'mestres' ? 'Guilda dos Mestres' : 'Taverna dos Aventureiros';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
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
        <Text numberOfLines={1} style={{ flex: 1, color: COLORS.primary, fontFamily: 'SourceSerif4_600SemiBold', fontSize: 17 }}>
          {nomeComunidade}
        </Text>
        <Pressable
          onPress={() => setShowParticipants((v) => !v)}
          accessibilityLabel="Participantes"
          style={{ padding: 12 }}>
          <MaterialIcons name="people" size={22} color={showParticipants ? COLORS.primary : COLORS.onSurfaceVariant} />
        </Pressable>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Chat */}
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 16, flexGrow: 1, justifyContent: 'flex-end' }}>
            {MESSAGES.map((m) => (
              <Bubble key={m.id} msg={m} />
            ))}
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              padding: 12,
              borderTopWidth: 1,
              borderTopColor: COLORS.outlineVariant,
            }}>
            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="Digite algo..."
              placeholderTextColor="rgba(213,196,171,0.5)"
              style={{
                flex: 1,
                minHeight: 44,
                backgroundColor: COLORS.surfaceContainerLowest,
                borderWidth: 1,
                borderColor: COLORS.outlineVariant,
                borderRadius: 999,
                paddingHorizontal: 16,
                color: COLORS.onSurface,
                fontFamily: 'AtkinsonHyperlegible_400Regular',
                fontSize: 14,
              }}
            />
            <Pressable
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: COLORS.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <MaterialIcons name="send" size={20} color={COLORS.onPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Painel de participantes (expansível) */}
        {showParticipants && (
          <View
            style={{
              width: 160,
              borderLeftWidth: 1,
              borderLeftColor: COLORS.outlineVariant,
              backgroundColor: COLORS.surfaceContainer,
              padding: 12,
              gap: 12,
            }}>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 11, letterSpacing: 1 }}>
              PARTICIPANTES
            </Text>
            {PARTICIPANTS.map((p) => (
              <View key={p.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: p.online ? '#4ADE80' : COLORS.outlineVariant,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 12 }}>
                    {p.name}
                  </Text>
                  <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: 10 }}>
                    {p.role}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
