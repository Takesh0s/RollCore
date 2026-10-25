import { useAcessibilidade } from '../store/acessibilidade';
// EventoFormModal.tsx — RollCore
//
// "Criação de Evento" (design: Criação de eventos no Calendário).
// Campos: nome, comunidade (mesa), descrição, data e cor.

import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable as NativePressable, ScrollView, Text as NativeText, View } from 'react-native';
import { AccessibleText as Text, AccessiblePressable as Pressable } from './accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, Field, Header, PrimaryButton, appFontSize } from '../design/shared';
import { Mesa } from '../store/mesas';
import { CORES_EVENTO, formatarBR, parseBR } from '../store/eventos';

export interface EventoFormDados {
  titulo: string;
  mesaId: string;
  descricao?: string;
  data: string; // AAAA-MM-DD
  cor: string;
}

function mascaraData(texto: string): string {
  const d = texto.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export default function EventoFormModal({
  visible,
  dataInicial,
  mesas,
  onClose,
  onSalvar,
}: {
  visible: boolean;
  dataInicial: string; // AAAA-MM-DD
  mesas: Mesa[];
  onClose: () => void;
  onSalvar: (dados: EventoFormDados) => void;
}) {
  useAcessibilidade();
  const labelStyle = { color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold' as const, fontSize: appFontSize(14), marginBottom: 8 };
  const erroStyle = { color: '#ffb4ab', fontFamily: 'AtkinsonHyperlegible_400Regular' as const, fontSize: appFontSize(13), marginTop: 4 };
  const [titulo, setTitulo] = useState('');
  const [mesaId, setMesaId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState('');
  const [cor, setCor] = useState(CORES_EVENTO[0]);
  const [tentou, setTentou] = useState(false);

  // Zera o formulário toda vez que abre.
  useEffect(() => {
    if (visible) {
      setTitulo('');
      setMesaId(mesas[0]?.id ?? '');
      setDescricao('');
      setData(formatarBR(dataInicial));
      setCor(CORES_EVENTO[0]);
      setTentou(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const dataISO = parseBR(data);
  const erroTitulo = !titulo.trim();
  const erroMesa = !mesaId;
  const erroData = !dataISO;

  const salvar = () => {
    setTentou(true);
    if (erroTitulo || erroMesa || erroData || !dataISO) return;
    onSalvar({ titulo: titulo.trim(), mesaId, descricao: descricao.trim() || undefined, data: dataISO, cor });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Header title="Criação de Evento" onBack={onClose} />

        <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }} keyboardShouldPersistTaps="handled">
          <View>
            <Field label="Nome do Evento" value={titulo} onChangeText={setTitulo} autoCapitalize="sentences" />
            {tentou && erroTitulo && <Text style={erroStyle}>Dê um nome ao evento.</Text>}
          </View>

          <View>
            <Text style={labelStyle}>Comunidade</Text>
            {mesas.length === 0 ? (
              <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular' }}>
                Você ainda não participa de nenhuma mesa.
              </Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {mesas.map((m) => {
                  const ativo = m.id === mesaId;
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => setMesaId(m.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: ativo }}
                      style={{
                        minHeight: 44,
                        paddingHorizontal: 14,
                        justifyContent: 'center',
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: ativo ? COLORS.primary : COLORS.outlineVariant,
                        backgroundColor: ativo ? COLORS.primary : COLORS.surfaceContainerHighest,
                      }}>
                      <Text
                        style={{
                          color: ativo ? COLORS.onPrimary : COLORS.onSurface,
                          fontFamily: 'AtkinsonHyperlegible_700Bold',
                          fontSize: appFontSize(14),
                        }}>
                        {m.titulo}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {tentou && erroMesa && <Text style={erroStyle}>Escolha uma comunidade.</Text>}
          </View>

          <Field
            label="Descrição do Evento"
            value={descricao}
            onChangeText={setDescricao}
            multiline
            autoCapitalize="sentences"
            style={{ minHeight: 110, textAlignVertical: 'top', paddingTop: 12 }}
          />

          <View>
            <Field
              label="Data do evento"
              icon="event"
              value={data}
              onChangeText={(t) => setData(mascaraData(t))}
              keyboardType="number-pad"
              placeholder="DD/MM/AAAA"
            />
            {tentou && erroData && <Text style={erroStyle}>Informe uma data válida (DD/MM/AAAA).</Text>}
          </View>

          <View>
            <Text style={labelStyle}>Cor do evento</Text>
            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              {CORES_EVENTO.map((c) => {
                const ativo = c === cor;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCor(c)}
                    accessibilityLabel={`Cor ${c}`}
                    accessibilityState={{ selected: ativo }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: c,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: ativo ? 3 : 0,
                      borderColor: COLORS.onSurface,
                    }}>
                    {ativo && <MaterialIcons name="check" size={22} color="#353839" />}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ marginTop: 8 }}>
            <PrimaryButton title="Salvar" icon="check" onPress={salvar} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
