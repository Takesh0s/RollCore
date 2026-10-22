import { useAcessibilidade } from '../store/acessibilidade';
// InventarioScreen.tsx — RollCore
//
// Inventário do personagem: bolsa de moedas, carga (peso x capacidade),
// busca + filtro por categoria e lista de itens com quantidade, equipar e
// remover. Dados vêm de store/inventario.ts; a Força vem de store/personagem.ts.

import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable as NativePressable, ScrollView, Text as NativeText, TextInput as NativeTextInput, View } from 'react-native';
import { AccessibleText as Text, AccessibleTextInput as TextInput, AccessiblePressable as Pressable } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { COLORS, Field, PrimaryButton, SecondaryButton, useAppFonts, appFontSize } from '../design/shared';
import {
  addItem,
  ajustarMoeda,
  alterarQuantidade,
  capacidadeCarga,
  CATEGORIAS,
  CategoriaItem,
  ItemInventario,
  Moedas,
  pesoTotal,
  removeItem,
  toggleEquipado,
  useInventario,
  useMoedas,
} from '../store/inventario';
import { usePersonagem } from '../store/personagem';

const SERIF = 'SourceSerif4_600SemiBold';
const SANS = 'AtkinsonHyperlegible_400Regular';
const SANS_BOLD = 'AtkinsonHyperlegible_700Bold';

const iconeDaCategoria = (c: CategoriaItem) => CATEGORIAS.find((x) => x.key === c)?.icon ?? 'inventory-2';
const fmtPeso = (kg: number) => `${kg.toFixed(1).replace('.', ',')} kg`;

function RoundButton({
  icon,
  onPress,
  label,
  color = COLORS.onSurfaceVariant,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  label: string;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={6}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surfaceContainerHighest,
        borderWidth: 1,
        borderColor: COLORS.outlineVariant,
      }}>
      <MaterialIcons name={icon} size={20} color={color} />
    </Pressable>
  );
}

function CoinPurse({ moedas }: { moedas: Moedas }) {
  const tipos: { key: keyof Moedas; nome: string; cor: string }[] = [
    { key: 'po', nome: 'Ouro', cor: COLORS.primaryContainer },
    { key: 'pp', nome: 'Prata', cor: COLORS.secondary },
    { key: 'pc', nome: 'Cobre', cor: '#d08a5b' },
  ];
  return (
    <View
      style={{
        backgroundColor: COLORS.surfaceContainer,
        borderRadius: 12,
        borderTopWidth: 2,
        borderTopColor: 'rgba(192,192,192,0.2)',
        padding: 16,
        gap: 12,
      }}>
      <Text style={{ color: COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(18) }}>Bolsa de moedas</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {tipos.map((t) => (
          <View
            key={t.key}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: 4,
              backgroundColor: COLORS.surfaceContainerHigh,
              borderRadius: 10,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: COLORS.outlineVariant,
            }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.cor }} />
            <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(24) }}>
              {moedas[t.key]}
            </Text>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: SANS, fontSize: appFontSize(12) }}>
              {t.nome} ({t.key.toUpperCase()})
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
              <RoundButton icon="remove" label={`Diminuir ${t.nome}`} onPress={() => ajustarMoeda(t.key, -1)} />
              <RoundButton icon="add" label={`Aumentar ${t.nome}`} onPress={() => ajustarMoeda(t.key, 1)} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function CargaBar({ atual, max }: { atual: number; max: number }) {
  const pct = Math.min(atual / max, 1);
  const pesado = atual > max * (2 / 3);
  const sobrecarregado = atual > max;
  const cor = sobrecarregado ? '#ffb4ab' : pesado ? COLORS.primaryContainer : COLORS.primary;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: COLORS.onSurface, fontFamily: SANS_BOLD, fontSize: appFontSize(14) }}>Carga</Text>
        <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: SANS, fontSize: appFontSize(14) }}>
          {fmtPeso(atual)} / {fmtPeso(max)}
        </Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: COLORS.surfaceContainerHighest, overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: cor }} />
      </View>
      {sobrecarregado && (
        <Text style={{ color: '#ffb4ab', fontFamily: SANS_BOLD, fontSize: appFontSize(12) }}>
          Sobrecarregado: deslocamento reduzido.
        </Text>
      )}
    </View>
  );
}

function ItemCard({ item }: { item: ItemInventario }) {
  const [aberto, setAberto] = useState(false);
  return (
    <View
      style={{
        backgroundColor: COLORS.surfaceContainerHigh,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: item.equipado ? 'rgba(192,192,192,0.5)' : COLORS.surfaceContainerHighest,
        marginBottom: 12,
        overflow: 'hidden',
      }}>
      <Pressable
        onPress={() => setAberto((a) => !a)}
        accessibilityLabel={`${item.nome}, ${item.quantidade} unidades`}
        accessibilityHint="Toque para ver detalhes"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 64 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: COLORS.surfaceContainerHighest,
          }}>
          <MaterialIcons name={iconeDaCategoria(item.categoria)} size={24} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(17) }}>{item.nome}</Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: SANS, fontSize: appFontSize(13) }}>
            {item.categoria} • {fmtPeso(item.peso * item.quantidade)}
          </Text>
        </View>
        {item.equipado && (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: COLORS.primary,
            }}>
            <Text style={{ color: COLORS.onPrimary, fontFamily: SANS_BOLD, fontSize: appFontSize(11) }}>Equipado</Text>
          </View>
        )}
        <MaterialIcons name={aberto ? 'expand-less' : 'expand-more'} size={24} color={COLORS.onSurfaceVariant} />
      </Pressable>

      {aberto && (
        <View
          style={{
            padding: 14,
            paddingTop: 12,
            gap: 12,
            borderTopWidth: 1,
            borderTopColor: COLORS.surfaceContainerHighest,
          }}>
          {item.descricao ? (
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: SANS, fontSize: appFontSize(14), lineHeight: 20 }}>
              {item.descricao}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <RoundButton icon="remove" label={`Diminuir ${item.nome}`} onPress={() => alterarQuantidade(item.id, -1)} />
              <Text
                style={{
                  color: COLORS.onSurface,
                  fontFamily: 'SourceSerif4_700Bold',
                  fontSize: appFontSize(20),
                  minWidth: 28,
                  textAlign: 'center',
                }}>
                {item.quantidade}
              </Text>
              <RoundButton icon="add" label={`Aumentar ${item.nome}`} onPress={() => alterarQuantidade(item.id, 1)} />
            </View>
            <RoundButton icon="delete-outline" color="#ffb4ab" label={`Remover ${item.nome}`} onPress={() => removeItem(item.id)} />
          </View>

          {(item.categoria === 'Arma' || item.categoria === 'Armadura' || item.categoria === 'Equipamento') && (
            <Pressable
              onPress={() => toggleEquipado(item.id)}
              accessibilityRole="button"
              style={{
                minHeight: 44,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
                borderWidth: 1,
                borderColor: COLORS.primary,
                backgroundColor: item.equipado ? 'transparent' : COLORS.primary,
              }}>
              <MaterialIcons
                name={item.equipado ? 'remove-circle-outline' : 'check-circle-outline'}
                size={18}
                color={item.equipado ? COLORS.primary : COLORS.onPrimary}
              />
              <Text style={{ color: item.equipado ? COLORS.primary : COLORS.onPrimary, fontFamily: SANS_BOLD, fontSize: appFontSize(14) }}>
                {item.equipado ? 'Desequipar' : 'Equipar'}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function NovoItemModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaItem>('Equipamento');
  const [quantidade, setQuantidade] = useState('1');
  const [peso, setPeso] = useState('0');
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState('');

  const fechar = () => {
    setNome(''); setCategoria('Equipamento'); setQuantidade('1'); setPeso('0'); setDescricao(''); setErro('');
    onClose();
  };

  const salvar = () => {
    const qtd = parseInt(quantidade, 10);
    const kg = parseFloat(peso.replace(',', '.'));
    if (!nome.trim()) return setErro('Dê um nome ao item.');
    if (!Number.isFinite(qtd) || qtd < 1) return setErro('A quantidade precisa ser 1 ou mais.');
    if (!Number.isFinite(kg) || kg < 0) return setErro('O peso precisa ser 0 ou mais.');
    addItem({ nome: nome.trim(), categoria, quantidade: qtd, peso: kg, descricao: descricao.trim() || undefined });
    fechar();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={fechar}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View
          style={{
            backgroundColor: COLORS.surfaceContainerHigh,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '90%',
          }}>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: COLORS.onSurface, fontFamily: SERIF, fontSize: appFontSize(22) }}>Novo item</Text>
              <RoundButton icon="close" label="Fechar" onPress={fechar} />
            </View>

            <Field label="Nome" icon="label" value={nome} onChangeText={setNome} placeholder="Ex.: Adaga" autoCapitalize="sentences" />

            <View style={{ gap: 6 }}>
              <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: SANS_BOLD, fontSize: appFontSize(14), paddingLeft: 4 }}>Categoria</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIAS.map((c) => {
                  const ativo = c.key === categoria;
                  return (
                    <Pressable
                      key={c.key}
                      onPress={() => setCategoria(c.key)}
                      accessibilityState={{ selected: ativo }}
                      style={{
                        minHeight: 44,
                        paddingHorizontal: 14,
                        borderRadius: 999,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: ativo ? COLORS.primaryContainer : COLORS.surfaceContainerHighest,
                      }}>
                      <MaterialIcons name={c.icon} size={16} color={ativo ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant} />
                      <Text style={{ fontFamily: SANS_BOLD, fontSize: appFontSize(13), color: ativo ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant }}>
                        {c.key}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Quantidade" value={quantidade} onChangeText={setQuantidade} keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Peso (kg)" value={peso} onChangeText={setPeso} keyboardType="decimal-pad" />
              </View>
            </View>

            <Field
              label="Descrição (opcional)"
              value={descricao}
              onChangeText={setDescricao}
              multiline
              autoCapitalize="sentences"
              style={{ minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }}
            />

            {erro ? <Text style={{ color: '#ffb4ab', fontFamily: SANS_BOLD, fontSize: appFontSize(14) }}>{erro}</Text> : null}

            <PrimaryButton title="Adicionar ao inventário" icon="add" onPress={salvar} />
            <SecondaryButton title="Cancelar" onPress={fechar} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function InventarioScreen() {
  useAcessibilidade();
  const fontsLoaded = useAppFonts();
  const itens = useInventario();
  const moedas = useMoedas();
  const personagem = usePersonagem();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<CategoriaItem | 'Todos'>('Todos');
  const [modalAberto, setModalAberto] = useState(false);

  if (!fontsLoaded) return null;

  const termo = busca.trim().toLowerCase();
  const visiveis = itens.filter(
    (i) => (filtro === 'Todos' || i.categoria === filtro) && (!termo || i.nome.toLowerCase().includes(termo)),
  );
  const max = capacidadeCarga(personagem.valores.for ?? 10);
  const filtros: (CategoriaItem | 'Todos')[] = ['Todos', ...CATEGORIAS.map((c) => c.key)];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Inventário" />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <CoinPurse moedas={moedas} />
        <CargaBar atual={pesoTotal(itens)} max={max} />

        <View style={{ justifyContent: 'center' }}>
          <MaterialIcons name="search" size={20} color={COLORS.onSurfaceVariant} style={{ position: 'absolute', left: 14, zIndex: 1 }} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar item"
            placeholderTextColor="rgba(192,192,192,0.5)"
            accessibilityLabel="Buscar item"
            style={{
              minHeight: 44,
              backgroundColor: COLORS.surfaceContainerHighest,
              borderWidth: 1,
              borderColor: COLORS.outlineVariant,
              borderRadius: 8,
              paddingLeft: 42,
              paddingRight: 12,
              color: COLORS.onSurface,
              fontFamily: SANS,
              fontSize: appFontSize(15),
            }}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {filtros.map((f) => {
            const ativo = f === filtro;
            return (
              <Pressable
                key={f}
                onPress={() => setFiltro(f)}
                accessibilityState={{ selected: ativo }}
                style={{
                  minHeight: 40,
                  paddingHorizontal: 16,
                  borderRadius: 999,
                  justifyContent: 'center',
                  backgroundColor: ativo ? COLORS.primaryContainer : COLORS.surfaceContainerHighest,
                }}>
                <Text style={{ fontFamily: SANS_BOLD, fontSize: appFontSize(13), color: ativo ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant }}>
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View>
          {visiveis.map((i) => (
            <ItemCard key={i.id} item={i} />
          ))}
          {visiveis.length === 0 && (
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: SANS, fontSize: appFontSize(15), textAlign: 'center', marginTop: 16 }}>
              {itens.length === 0 ? 'Seu inventário está vazio.' : 'Nenhum item encontrado.'}
            </Text>
          )}
        </View>
        <View style={{ height: 72 }} />
      </ScrollView>

      <Pressable
        onPress={() => setModalAberto(true)}
        accessibilityLabel="Adicionar item"
        style={{
          position: 'absolute',
          right: 16,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: COLORS.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.4,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 8,
        }}>
        <MaterialIcons name="add" size={28} color={COLORS.onPrimary} />
      </Pressable>

      <NovoItemModal visible={modalAberto} onClose={() => setModalAberto(false)} />
    </SafeAreaView>
  );
}
