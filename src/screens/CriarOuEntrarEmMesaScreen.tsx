import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Field, Header, PrimaryButton, useAppFonts } from '../design/shared';
import { addMesa, entrarPorCodigo } from '../store/mesas';

const SISTEMAS = ['D&D 5e', 'Tormenta20', 'Call of Cthulhu', 'Pathfinder 2e', 'Outro'];

function SystemPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 14, paddingLeft: 4 }}>
        Sistema de RPG
      </Text>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={{
          minHeight: 48,
          backgroundColor: COLORS.surfaceContainerLowest,
          borderWidth: 2,
          borderColor: open ? COLORS.primary : COLORS.outlineVariant,
          borderRadius: 8,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text
          style={{
            color: value ? COLORS.onSurface : 'rgba(213,196,171,0.5)',
            fontFamily: 'AtkinsonHyperlegible_400Regular',
            fontSize: 16,
          }}>
          {value || 'Selecione um sistema...'}
        </Text>
        <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={22} color={COLORS.onSurfaceVariant} />
      </Pressable>
      {open && (
        <View
          style={{
            backgroundColor: COLORS.surfaceContainerHigh,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: COLORS.outlineVariant,
            overflow: 'hidden',
          }}>
          {SISTEMAS.map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                onChange(s);
                setOpen(false);
              }}
              style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: 15 }}>
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export default function CriarOuEntrarEmMesaScreen() {
  const router = useRouter();
  const fontsLoaded = useAppFonts();
  const [tab, setTab] = useState<'criar' | 'entrar'>('criar');

  const [nome, setNome] = useState('');
  const [sistema, setSistema] = useState('');
  const [descricao, setDescricao] = useState('');
  const [codigo, setCodigo] = useState('');

  if (!fontsLoaded) return null;

  const goBack = () => router.back();

  const handleCriar = () => {
    if (!nome.trim()) return;
    addMesa({ titulo: nome, sistema, descricao });
    router.push('/mesas');
  };

  const handleEntrar = () => {
    if (!codigo.trim()) return;
    entrarPorCodigo(codigo);
    router.push('/mesas');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="Mesa" onBack={goBack} rightIcon="person" />

      <View style={{ flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 0 }}>
        <Pressable
          onPress={() => setTab('criar')}
          style={{
            flex: 1,
            minHeight: 48,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: tab === 'criar' ? COLORS.primaryContainer : 'transparent',
          }}>
          <Text
            style={{
              fontFamily: 'AtkinsonHyperlegible_700Bold',
              fontSize: 14,
              color: tab === 'criar' ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant,
            }}>
            Criar Mesa
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('entrar')}
          style={{
            flex: 1,
            minHeight: 48,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: tab === 'entrar' ? COLORS.primaryContainer : 'transparent',
          }}>
          <Text
            style={{
              fontFamily: 'AtkinsonHyperlegible_700Bold',
              fontSize: 14,
              color: tab === 'entrar' ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant,
            }}>
            Entrar em Mesa
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={{ padding: 16, gap: 20, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {tab === 'criar' ? (
            <>
              <View
                style={{
                  height: 128,
                  borderRadius: 12,
                  overflow: 'hidden',
                  backgroundColor: COLORS.surfaceContainerHighest,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Image
                  source={{
                    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTLsdSbHiMSVoNu3p-uYpi3ztwYMsJ7M43CKns4oVWiKSOltlCNleAcLdGXuggJMxtapvIfCHNiHO69ZeQBjpv46gC_WU2MbG3k9HXmF0jiDuKXlt7MtP6GFw6KycQonKVjsWrUHAyF4_aeIm0qWIzsTw2EN8PBHH0uDvWbpWnQnwFpYbtHRyhAZ6N6m1aUXyakJBa8yCiphOpO58c2tHJBmLHXDK8h_8OtV3ManFjU35uvfC6NfMXgQ',
                  }}
                  style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.4 }}
                  resizeMode="cover"
                />
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    borderWidth: 2,
                    borderColor: COLORS.primary,
                    backgroundColor: 'rgba(255,184,0,0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <MaterialIcons name="add" size={32} color={COLORS.primary} />
                </View>
              </View>

              <Field label="Nome da Mesa" placeholder="Ex: A Batalha de Águas Profundas" value={nome} onChangeText={setNome} />

              <SystemPicker value={sistema} onChange={setSistema} />

              <View style={{ gap: 4 }}>
                <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 14, paddingLeft: 4 }}>
                  Descrição <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular' }}>(Opcional)</Text>
                </Text>
                <TextInput
                  value={descricao}
                  onChangeText={setDescricao}
                  placeholder="Uma breve descrição sobre a campanha..."
                  placeholderTextColor="rgba(213,196,171,0.5)"
                  multiline
                  numberOfLines={4}
                  style={{
                    minHeight: 96,
                    backgroundColor: COLORS.surfaceContainerLowest,
                    borderWidth: 2,
                    borderColor: COLORS.outlineVariant,
                    borderRadius: 8,
                    padding: 16,
                    color: COLORS.onSurface,
                    fontFamily: 'AtkinsonHyperlegible_400Regular',
                    fontSize: 15,
                    textAlignVertical: 'top',
                  }}
                />
              </View>

              <View style={{ flex: 1 }} />
              <PrimaryButton title="Criar Mesa" icon="edit-document" onPress={handleCriar} />
            </>
          ) : (
            <>
              <View style={{ alignItems: 'center', gap: 8, marginTop: 24 }}>
                <View
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    borderWidth: 2,
                    borderColor: 'rgba(158,143,120,0.5)',
                    backgroundColor: COLORS.surfaceContainerHighest,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <MaterialIcons name="vpn-key" size={40} color={COLORS.onSurfaceVariant} />
                </View>
                <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: 20, textAlign: 'center' }}>
                  Possui um Código de Convite?
                </Text>
                <Text
                  style={{
                    color: COLORS.onSurfaceVariant,
                    fontFamily: 'AtkinsonHyperlegible_400Regular',
                    fontSize: 14,
                    textAlign: 'center',
                    maxWidth: 280,
                  }}>
                  Insira o código fornecido pelo seu Mestre para entrar rapidamente na campanha.
                </Text>
              </View>

              <TextInput
                value={codigo}
                onChangeText={(t) => setCodigo(t.toUpperCase())}
                placeholder="EX: AX7-99B"
                placeholderTextColor="rgba(213,196,171,0.3)"
                autoCapitalize="characters"
                style={{
                  height: 64,
                  backgroundColor: COLORS.surfaceContainerLowest,
                  borderWidth: 2,
                  borderColor: COLORS.outlineVariant,
                  borderRadius: 12,
                  textAlign: 'center',
                  color: COLORS.onSurface,
                  fontFamily: 'SourceSerif4_700Bold',
                  fontSize: 22,
                  letterSpacing: 4,
                }}
              />

              <View style={{ flex: 1 }} />
              <PrimaryButton title="Entrar na Mesa" icon="login" onPress={handleEntrar} />
              <Pressable style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ color: COLORS.primary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 13 }}>
                  Onde encontro meu código?
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}