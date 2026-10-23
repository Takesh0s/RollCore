import { useAcessibilidade } from '../store/acessibilidade';
// CalendarioScreen.tsx — RollCore
//
// Calendário mensal com eventos das mesas (design: Calendário).
// - Toque num dia para ver os eventos dele; sem dia selecionado, lista os do mês.
// - Cada evento tem Confirmar / Recusar.
// - "Criar Evento" abre o formulário (usuário não pagante vê um aviso).

import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable as NativePressable, ScrollView, Text as NativeText, View } from 'react-native';
import { AccessibleText as Text, AccessiblePressable as Pressable } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import EventoFormModal from '../components/EventoFormModal';
import { COLORS, useAppFonts, appFontSize } from '../design/shared';
import {
  Evento,
  addEvento,
  doISO,
  formatarCurto,
  paraISO,
  responderEvento,
  useEventos,
  usePagante,
} from '../store/eventos';
import { useMesas } from '../store/mesas';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const VERDE = '#6fbf9b';
const VERMELHO = '#e57373';

function gerarGrade(ano: number, mes: number): Date[] {
  const primeiro = new Date(ano, mes, 1);
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const total = Math.ceil((primeiro.getDay() + diasNoMes) / 7) * 7;
  return Array.from({ length: total }, (_, i) => new Date(ano, mes, 1 - primeiro.getDay() + i));
}

function EventoItem({ evento, mesaTitulo }: { evento: Evento; mesaTitulo?: string }) {
  const confirmado = evento.resposta === 'confirmado';
  const recusado = evento.resposta === 'recusado';
  return (
    <View
      style={{
        backgroundColor: COLORS.surfaceContainerHigh,
        borderWidth: 1,
        borderColor: COLORS.surfaceContainerHighest,
        borderRadius: 12,
        padding: 14,
        gap: 10,
      }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: evento.cor, marginTop: 2 }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(15) }}>
            {formatarCurto(evento.data)}: {evento.titulo} ({evento.confirmados}/{evento.total} confirmados)
          </Text>
          {mesaTitulo && (
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(12) }}>
              {mesaTitulo}
            </Text>
          )}
          {evento.descricao ? (
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(13) }}>
              {evento.descricao}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
        <Pressable
          onPress={() => responderEvento(evento.id, 'confirmado')}
          accessibilityLabel="Confirmar presença"
          accessibilityState={{ selected: confirmado }}
          style={{
            minHeight: 44,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 18,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: VERDE,
            backgroundColor: confirmado ? VERDE : 'transparent',
          }}>
          <MaterialIcons name="check" size={20} color={confirmado ? '#353839' : VERDE} />
          <Text style={{ color: confirmado ? '#353839' : VERDE, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13) }}>
            Confirmar
          </Text>
        </Pressable>
        <Pressable
          onPress={() => responderEvento(evento.id, 'recusado')}
          accessibilityLabel="Recusar presença"
          accessibilityState={{ selected: recusado }}
          style={{
            minHeight: 44,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 18,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: VERMELHO,
            backgroundColor: recusado ? VERMELHO : 'transparent',
          }}>
          <MaterialIcons name="close" size={20} color={recusado ? '#353839' : VERMELHO} />
          <Text style={{ color: recusado ? '#353839' : VERMELHO, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13) }}>
            Recusar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Aviso({
  visible,
  icon,
  titulo,
  texto,
  primario,
  secundario,
}: {
  visible: boolean;
  icon: keyof typeof MaterialIcons.glyphMap;
  titulo: string;
  texto: string;
  primario: { label: string; onPress: () => void };
  secundario?: { label: string; onPress: () => void };
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={secundario?.onPress ?? primario.onPress}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View
          style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: COLORS.surfaceContainerHigh,
            borderWidth: 1,
            borderColor: COLORS.outlineVariant,
            borderRadius: 16,
            padding: 20,
            gap: 12,
            alignItems: 'center',
          }}>
          <MaterialIcons name={icon} size={36} color={COLORS.primary} />
          <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(20), textAlign: 'center' }}>
            {titulo}
          </Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(15), textAlign: 'center' }}>
            {texto}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            {secundario && (
              <Pressable
                onPress={secundario.onPress}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 16,
                  justifyContent: 'center',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: COLORS.outlineVariant,
                  backgroundColor: COLORS.surfaceContainerHighest,
                }}>
                <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>
                  {secundario.label}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={primario.onPress}
              style={{
                minHeight: 44,
                paddingHorizontal: 16,
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: COLORS.primary,
              }}>
              <Text style={{ color: COLORS.onPrimary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>
                {primario.label}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function CalendarioScreen() {
  useAcessibilidade();
  const fontsLoaded = useAppFonts();
  const eventos = useEventos();
  const mesas = useMesas();
  const pagante = usePagante();

  const hoje = new Date();
  const hojeISO = paraISO(hoje);
  const [cursor, setCursor] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [premiumAberto, setPremiumAberto] = useState(false);
  const [criado, setCriado] = useState<Evento | null>(null);

  if (!fontsLoaded) return null;

  const ano = cursor.getFullYear();
  const mes = cursor.getMonth();
  const grade = gerarGrade(ano, mes);
  const semanas: Date[][] = [];
  for (let i = 0; i < grade.length; i += 7) semanas.push(grade.slice(i, i + 7));

  const porDia: Record<string, Evento[]> = {};
  eventos.forEach((e) => {
    (porDia[e.data] ??= []).push(e);
  });

  const lista = (selecionado
    ? porDia[selecionado] ?? []
    : eventos.filter((e) => {
        const d = doISO(e.data);
        return d.getFullYear() === ano && d.getMonth() === mes;
      })
  )
    .slice()
    .sort((a, b) => a.data.localeCompare(b.data));

  const mudarMes = (delta: number) => {
    setCursor(new Date(ano, mes + delta, 1));
    setSelecionado(null);
  };

  const tituloMesa = (id: string) => mesas.find((m) => m.id === id)?.titulo;

  const abrirCriar = () => (pagante ? setFormAberto(true) : setPremiumAberto(true));

  const salvar = (dados: Parameters<typeof addEvento>[0]) => {
    const novo = addEvento(dados);
    setFormAberto(false);
    setCriado(novo);
  };

  const irParaEvento = () => {
    if (!criado) return;
    const d = doISO(criado.data);
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelecionado(criado.data);
    setCriado(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Calendário" />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Calendário */}
        <View
          style={{
            backgroundColor: COLORS.surfaceContainerHigh,
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: COLORS.surfaceContainerHighest,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: COLORS.surfaceContainerHighest,
            }}>
            <Pressable onPress={() => mudarMes(-1)} accessibilityLabel="Mês anterior" style={{ padding: 10 }}>
              <MaterialIcons name="chevron-left" size={26} color={COLORS.primary} />
            </Pressable>
            <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(18) }}>
              {MESES[mes]} {ano}
            </Text>
            <Pressable onPress={() => mudarMes(1)} accessibilityLabel="Próximo mês" style={{ padding: 10 }}>
              <MaterialIcons name="chevron-right" size={26} color={COLORS.primary} />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row' }}>
            {DIAS_SEMANA.map((d, i) => (
              <Text
                key={i}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  paddingVertical: 6,
                  color: COLORS.outline,
                  fontFamily: 'AtkinsonHyperlegible_700Bold',
                  fontSize: appFontSize(12),
                }}>
                {d}
              </Text>
            ))}
          </View>

          {semanas.map((semana, si) => (
            <View key={si} style={{ flexDirection: 'row' }}>
              {semana.map((dia) => {
                const iso = paraISO(dia);
                const dentro = dia.getMonth() === mes;
                const evs = porDia[iso] ?? [];
                const sel = iso === selecionado;
                const ehHoje = iso === hojeISO;
                return (
                  <Pressable
                    key={iso}
                    onPress={() => setSelecionado(sel ? null : iso)}
                    accessibilityLabel={`${dia.getDate()} de ${MESES[dia.getMonth()]}${
                      evs.length ? `, ${evs.length} evento(s)` : ''
                    }`}
                    style={{
                      flex: 1,
                      height: 54,
                      padding: 3,
                      borderWidth: sel ? 2 : 0.5,
                      borderColor: sel ? COLORS.primary : COLORS.outlineVariant,
                      backgroundColor: dentro ? COLORS.surfaceContainer : COLORS.surfaceContainerLowest,
                    }}>
                    <Text
                      style={{
                        color: ehHoje ? COLORS.primary : dentro ? COLORS.onSurface : COLORS.outline,
                        fontFamily: ehHoje ? 'AtkinsonHyperlegible_700Bold' : 'AtkinsonHyperlegible_400Regular',
                        fontSize: appFontSize(12),
                      }}>
                      {dia.getDate()}
                    </Text>
                    {evs.length > 0 && (
                      <View
                        style={{
                          position: 'absolute',
                          right: 3,
                          bottom: 3,
                          minWidth: 26,
                          height: 26,
                          paddingHorizontal: 3,
                          borderRadius: 13,
                          borderWidth: 1.5,
                          borderColor: evs[0].cor,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <Text style={{ color: evs[0].cor, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(9) }}>
                          {evs.length === 1 ? `${evs[0].confirmados}/${evs[0].total}` : `${evs.length}`}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* Eventos */}
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(13) }}>
          {selecionado ? `Eventos de ${formatarCurto(selecionado)}` : `Eventos de ${MESES[mes]}`}
        </Text>

        {lista.length === 0 ? (
          <Text
            style={{
              color: COLORS.onSurfaceVariant,
              fontFamily: 'AtkinsonHyperlegible_400Regular',
              fontSize: appFontSize(15),
              textAlign: 'center',
              marginVertical: 12,
            }}>
            Nenhum evento {selecionado ? 'neste dia' : 'neste mês'}.
          </Text>
        ) : (
          lista.map((e) => <EventoItem key={e.id} evento={e} mesaTitulo={tituloMesa(e.mesaId)} />)
        )}

        <Pressable
          onPress={abrirCriar}
          accessibilityLabel="Criar Evento"
          style={{
            alignSelf: 'center',
            marginTop: 8,
            minHeight: 48,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderRadius: 999,
            backgroundColor: COLORS.primary,
          }}>
          <MaterialIcons name="add" size={22} color={COLORS.onPrimary} />
          <Text style={{ color: COLORS.onPrimary, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(15) }}>
            Criar Evento
          </Text>
        </Pressable>
      </ScrollView>

      <EventoFormModal
        visible={formAberto}
        dataInicial={selecionado ?? hojeISO}
        mesas={mesas}
        onClose={() => setFormAberto(false)}
        onSalvar={salvar}
      />

      <Aviso
        visible={criado !== null}
        icon="event-available"
        titulo="Evento criado!"
        texto={criado ? `“${criado.titulo}” foi criado para ${formatarCurto(criado.data)}. Os jogadores serão avisados para confirmar presença.` : ''}
        primario={{ label: 'Ir para o evento', onPress: irParaEvento }}
        secundario={{ label: 'Fechar', onPress: () => setCriado(null) }}
      />

      <Aviso
        visible={premiumAberto}
        icon="lock"
        titulo="Recurso para usuários pagantes"
        texto="Criar eventos no calendário está disponível apenas para usuários pagantes."
        primario={{ label: 'Entendi', onPress: () => setPremiumAberto(false) }}
      />
    </SafeAreaView>
  );
}
