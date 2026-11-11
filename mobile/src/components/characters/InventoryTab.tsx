import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../accessible-text';
import { Chip, ConfirmDialog, FormGroup, StateBlock, inputStyle } from '../Controls';
import { COLORS, appFontSize } from '../../design/shared';
import { addItem, capacityOf, fetchInventory, removeItem, saveCoins, saveItem } from '../../lib/inventory';
import { mensagemDeErro } from '../../services/api';
import { showToast } from '../../store/useToast';
import type { Character, Coins, InventoryItem } from '../../types';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';
const SERIF = 'SourceSerif4_700Bold';

const CATEGORIES: { id: InventoryItem['category']; label: string }[] = [
  { id: 'weapon', label: 'Arma' }, { id: 'armor', label: 'Armadura' }, { id: 'consumable', label: 'Consumível' }, { id: 'other', label: 'Outro' },
];
const COIN_ROWS: { key: keyof Coins; label: string; color: string }[] = [
  { key: 'pp', label: 'Platina', color: '#e8e8ee' }, { key: 'gp', label: 'Ouro', color: '#e8b84a' },
  { key: 'sp', label: 'Prata', color: '#b9b9bd' }, { key: 'cp', label: 'Cobre', color: '#cf8a5a' },
];
const MAX_COIN = 999_999;
const num = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

interface Draft { id?: string; name: string; category: InventoryItem['category']; quantity: string; weight: string; damage: string; description: string }
const EMPTY: Draft = { name: '', category: 'other', quantity: '1', weight: '0', damage: '', description: '' };
const toDraft = (i: InventoryItem): Draft => ({
  id: i.id, name: i.name, category: i.category, quantity: String(i.quantity), weight: String(i.weight), damage: i.damage ?? '', description: i.description ?? '',
});

/** Aba Inventário da ficha: itens (quantidade, dano/CA), moedas e resumo de peso. */
export function InventoryTab({ char }: { char: Character }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [coins, setCoins] = useState<Coins>({ pp: 0, gp: 0, sp: 0, cp: 0 });
  const [coinText, setCoinText] = useState<Record<keyof Coins, string>>({ pp: '0', gp: '0', sp: '0', cp: '0' });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<InventoryItem | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true); setFailed(false);
    fetchInventory(char.id)
      .then((data) => {
        if (!alive) return;
        setItems(data.items); setCoins(data.coins);
        setCoinText({ pp: String(data.coins.pp), gp: String(data.coins.gp), sp: String(data.coins.sp), cp: String(data.coins.cp) });
      })
      .catch(() => { if (alive) setFailed(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [char.id, attempt]);

  const total = items.reduce((sum, i) => sum + i.weight * i.quantity, 0);
  const capacity = capacityOf(char.attributes.STR);

  // Quantidade: otimista, desfaz se o servidor recusar
  async function step(item: InventoryItem, delta: number) {
    const quantity = Math.max(0, Math.min(9999, item.quantity + delta));
    if (quantity === item.quantity) return;
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, quantity } : i)));
    try {
      await saveItem(char.id, item.id, { ...item, quantity });
    } catch (e) {
      setItems((list) => list.map((i) => (i.id === item.id ? item : i)));
      showToast(mensagemDeErro(e), 'error');
    }
  }

  async function saveDraft() {
    if (!draft) return;
    const quantity = Number(draft.quantity);
    const weight = Number(draft.weight.replace(',', '.'));
    if (!draft.name.trim()) { showToast('Informe o nome do item.', 'error'); return; }
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 9999) { showToast('Quantidade entre 0 e 9999.', 'error'); return; }
    if (!Number.isFinite(weight) || weight < 0 || weight > 99999) { showToast('Peso inválido.', 'error'); return; }
    setSaving(true);
    try {
      const body = { name: draft.name.trim(), category: draft.category, quantity, weight, damage: draft.damage, description: draft.description };
      if (draft.id) {
        const data = await saveItem(char.id, draft.id, body);
        setItems((list) => list.map((i) => (i.id === data.id ? data : i)));
      } else {
        const data = await addItem(char.id, body);
        setItems((list) => [...list, data]);
      }
      setDraft(null);
    } catch (e) {
      showToast(mensagemDeErro(e), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmRemove() {
    const item = removing;
    if (!item) return;
    setRemoving(null);
    try {
      await removeItem(char.id, item.id);
      setItems((list) => list.filter((i) => i.id !== item.id));
      setDraft((d) => (d?.id === item.id ? null : d));
    } catch (e) {
      showToast(mensagemDeErro(e), 'error');
    }
  }

  // Moedas: salva ao sair do campo
  async function commitCoin(key: keyof Coins) {
    const n = Math.max(0, Math.min(MAX_COIN, Math.floor(Number(coinText[key]) || 0)));
    setCoinText((t) => ({ ...t, [key]: String(n) }));
    if (n === coins[key]) return;
    const previous = coins;
    const next = { ...coins, [key]: n };
    setCoins(next);
    try {
      await saveCoins(char.id, next);
    } catch (e) {
      setCoins(previous); setCoinText((t) => ({ ...t, [key]: String(previous[key]) }));
      showToast(mensagemDeErro(e), 'error');
    }
  }

  if (loading) return <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, textAlign: 'center', paddingVertical: 24 }}>Carregando inventário…</Text>;
  if (failed) return <StateBlock icon="cloud-off" title="Não foi possível carregar o inventário" actionLabel="Tentar de novo" onAction={() => setAttempt((a) => a + 1)} />;

  const card = { gap: 10, padding: 14, borderRadius: 14, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant } as const;
  const stepBtn = { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant } as const;

  return (
    <View style={{ gap: 14 }}>
      <View style={card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(18) }}>Itens</Text>
          <Pressable onPress={() => setDraft({ ...EMPTY })} accessibilityLabel="Adicionar item"
            style={{ paddingHorizontal: 14, minHeight: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
            <Text style={{ color: COLORS.onPrimary, fontFamily: BOLD, fontSize: appFontSize(13) }}>+ Adicionar item</Text>
          </Pressable>
        </View>
        {items.length === 0 && <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>Nenhum item ainda. Adicione o primeiro.</Text>}
        {items.map((item) => (
          <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.outlineVariant }}>
            <Pressable onPress={() => setDraft(toDraft(item))} accessibilityLabel={`Editar ${item.name}`} style={{ flex: 1 }}>
              <Text numberOfLines={2} style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(15) }}>{item.name}</Text>
              <Text numberOfLines={1} style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{item.damage || '—'}</Text>
            </Pressable>
            <Pressable onPress={() => step(item, -1)} disabled={item.quantity <= 0} accessibilityLabel={`Diminuir ${item.name}`} style={[stepBtn, { opacity: item.quantity <= 0 ? 0.4 : 1 }]}>
              <MaterialIcons name="remove" size={20} color={COLORS.onSurface} />
            </Pressable>
            <Text accessibilityLabel={`Quantidade ${item.quantity}`} style={{ minWidth: 30, textAlign: 'center', color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(16) }}>{item.quantity}</Text>
            <Pressable onPress={() => step(item, 1)} accessibilityLabel={`Aumentar ${item.name}`} style={stepBtn}>
              <MaterialIcons name="add" size={20} color={COLORS.onSurface} />
            </Pressable>
            <Pressable onPress={() => setRemoving(item)} accessibilityLabel={`Remover ${item.name}`} style={{ padding: 6 }}>
              <MaterialIcons name="delete-outline" size={22} color={COLORS.onSurfaceVariant} />
            </Pressable>
          </View>
        ))}
      </View>

      <View style={card}>
        <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(18) }}>Moedas</Text>
        {COIN_ROWS.map((c) => (
          <View key={c.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View accessibilityElementsHidden style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: c.color }} />
            <Text style={{ flex: 1, color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(15) }}>{c.label}</Text>
            <TextInput value={coinText[c.key]} onChangeText={(t) => setCoinText((s) => ({ ...s, [c.key]: t.replace(/\D/g, '').slice(0, 6) }))}
              onBlur={() => commitCoin(c.key)} onSubmitEditing={() => commitCoin(c.key)} keyboardType="number-pad" accessibilityLabel={`Moedas de ${c.label.toLowerCase()}`}
              selectTextOnFocus style={[inputStyle(), { width: 110, textAlign: 'right' }]} />
          </View>
        ))}
      </View>

      <View style={card}>
        <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(18) }}>Resumo</Text>
        {([['Pontos de vida', `${char.hp} / ${char.max_hp}`, false], ['Classe de armadura', String(char.ac), false], ['Peso carregado', `${num(total)} / ${capacity} kg`, total > capacity]] as const).map(([k, v, over]) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>{k}</Text>
            <Text style={{ color: over ? '#e57373' : COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>{v}</Text>
          </View>
        ))}
        {total > capacity && <Text style={{ color: '#e57373', fontFamily: BODY, fontSize: appFontSize(12) }}>Acima da capacidade de carga.</Text>}
      </View>

      {draft && (
        <Modal visible transparent animationType="slide" onRequestClose={() => !saving && setDraft(null)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}>
            <View accessibilityViewIsModal style={{ maxHeight: '90%', padding: 18, borderTopLeftRadius: 18, borderTopRightRadius: 18, backgroundColor: COLORS.surfaceContainerHigh }}>
              <ScrollView contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">
                <Text style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(20) }}>{draft.id ? 'Editar item' : 'Novo item'}</Text>
                <FormGroup label="Nome">
                  <TextInput value={draft.name} onChangeText={(t) => setDraft({ ...draft, name: t })} maxLength={80} style={inputStyle()} placeholderTextColor={COLORS.placeholder} />
                </FormGroup>
                <FormGroup label="Categoria">
                  <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {CATEGORIES.map((c) => <Chip key={c.id} label={c.label} on={draft.category === c.id} onPress={() => setDraft({ ...draft, category: c.id })} />)}
                  </View>
                </FormGroup>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}><FormGroup label="Quantidade">
                    <TextInput value={draft.quantity} onChangeText={(t) => setDraft({ ...draft, quantity: t.replace(/\D/g, '') })} keyboardType="number-pad" maxLength={4} style={inputStyle()} />
                  </FormGroup></View>
                  <View style={{ flex: 1 }}><FormGroup label="Peso por unidade (kg)">
                    <TextInput value={draft.weight} onChangeText={(t) => setDraft({ ...draft, weight: t.replace(/[^\d.,]/g, '') })} keyboardType="decimal-pad" style={inputStyle()} />
                  </FormGroup></View>
                </View>
                <FormGroup label="Dano ou CA">
                  <TextInput value={draft.damage} onChangeText={(t) => setDraft({ ...draft, damage: t })} maxLength={40} placeholder="1D8 Cort. · 11 + Dex CA" placeholderTextColor={COLORS.placeholder} style={inputStyle()} />
                </FormGroup>
                <FormGroup label="Descrição">
                  <TextInput value={draft.description} onChangeText={(t) => setDraft({ ...draft, description: t })} maxLength={500} multiline numberOfLines={3}
                    placeholder="Notas, efeitos, dano…" placeholderTextColor={COLORS.placeholder} style={[inputStyle(), { minHeight: 84, paddingTop: 12, textAlignVertical: 'top' }]} />
                </FormGroup>
                <View style={{ gap: 10 }}>
                  <Pressable onPress={saveDraft} disabled={saving} style={{ minHeight: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, opacity: saving ? 0.6 : 1 }}>
                    <Text style={{ color: COLORS.onPrimary, fontFamily: BOLD, fontSize: appFontSize(15) }}>{saving ? 'Salvando…' : 'Salvar item'}</Text>
                  </Pressable>
                  {draft.id ? (
                    <Pressable onPress={() => setRemoving(items.find((i) => i.id === draft.id) ?? null)} style={{ minHeight: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#c0392b' }}>
                      <Text style={{ color: '#fff', fontFamily: BOLD, fontSize: appFontSize(14) }}>Excluir item</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => setDraft(null)} disabled={saving} style={{ minHeight: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant }}>
                    <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>Cancelar</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
          <ConfirmDialog visible={!!removing} danger title="Remover item" message={removing ? `Remover "${removing.name}" do inventário?` : ''}
            confirmLabel="Remover" onConfirm={confirmRemove} onCancel={() => setRemoving(null)} />
        </Modal>
      )}
      {!draft && (
        <ConfirmDialog visible={!!removing} danger title="Remover item" message={removing ? `Remover "${removing.name}" do inventário?` : ''}
          confirmLabel="Remover" onConfirm={confirmRemove} onCancel={() => setRemoving(null)} />
      )}
    </View>
  );
}
