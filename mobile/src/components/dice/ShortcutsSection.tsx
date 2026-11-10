import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../accessible-text';
import { Chip, FormGroup, inputStyle } from '../Controls';
import { COLORS, appFontSize } from '../../design/shared';
import { validateFormula } from '../../lib/dice';
import { fetchCharacterSpells } from '../../lib/characters';
import { itemRollables, spellRollables, type Rollable } from '../../lib/weapons';
import { request } from '../../services/api';
import type { Character, DiceShortcut, InventoryApiResponse } from '../../types';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';
const SERIF = 'SourceSerif4_700Bold';

type Filter = 'all' | 'weapon' | 'spell' | 'item' | 'mine';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' }, { id: 'weapon', label: 'Armas' }, { id: 'spell', label: 'Magias' },
  { id: 'item', label: 'Itens' }, { id: 'mine', label: 'Meus' },
];
const MAX_SHORTCUTS = 12;
const fmt = (f: string) => f.replace(/([+-])/g, ' $1 ');
const groupOf = (r: Rollable): Filter => (r.kind === 'weapon' ? 'weapon' : r.kind === 'item' ? 'item' : 'spell');

function Card({ title, sub, tag, children, onRemove }: { title: string; sub: string; tag: string; children: React.ReactNode; onRemove?: () => void }) {
  return (
    <View style={{ width: 200, gap: 4, padding: 12, borderRadius: 12, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
        <Text numberOfLines={2} style={{ flex: 1, color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>{title}</Text>
        {onRemove ? (
          <Pressable onPress={onRemove} accessibilityLabel={`Remover atalho ${title}`} hitSlop={8}><MaterialIcons name="close" size={18} color={COLORS.onSurfaceVariant} /></Pressable>
        ) : null}
      </View>
      <Text style={{ color: COLORS.primary, fontFamily: BODY, fontSize: appFontSize(13) }}>{sub}</Text>
      <Text numberOfLines={2} style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(11) }}>{tag}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>{children}</View>
    </View>
  );
}

function Go({ label, onPress, disabled, a11y }: { label: string; onPress: () => void; disabled: boolean; a11y: string }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityLabel={a11y}
      style={{ flex: 1, minHeight: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, opacity: disabled ? 0.5 : 1 }}>
      <Text style={{ color: COLORS.onPrimary, fontFamily: BOLD, fontSize: appFontSize(12) }}>{label}</Text>
    </Pressable>
  );
}

/**
 * Atalhos de rolagem: o que o personagem tem na ficha (armas, magias, itens, com o bônus calculado)
 * e as fórmulas salvas pelo usuário.
 */
export function ShortcutsSection({ characters, shortcuts, rolling, currentFormula, onRoll, onCreate, onRemove }: {
  characters: Character[];
  shortcuts: DiceShortcut[];
  rolling: boolean;
  currentFormula: string;
  onRoll: (formula: string, label: string) => void;
  onCreate: (name: string, formula: string) => Promise<boolean>;
  onRemove: (id: string) => void;
}) {
  const [charId, setCharId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [list, setList] = useState<Rollable[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const char = characters.find((c) => c.id === charId) ?? characters[0];

  useEffect(() => {
    if (!char) { setList([]); return; }
    let alive = true;
    setLoading(true);
    Promise.all([
      request<InventoryApiResponse>(`/characters/${char.id}/inventory`).then((r) => itemRollables(char, r.items)).catch(() => [] as Rollable[]),
      fetchCharacterSpells(char.id).then((s) => spellRollables(char, s)).catch(() => [] as Rollable[]),
    ]).then(([items, spells]) => { if (alive) setList([...items, ...spells]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [char?.id, char?.attributes, char?.level, char?.class]);

  const sheet = useMemo(() => (filter === 'mine' ? [] : filter === 'all' ? list : list.filter((r) => groupOf(r) === filter)), [list, filter]);
  const mine = filter === 'all' || filter === 'mine' ? shortcuts : [];
  const nothing = !loading && sheet.length === 0 && mine.length === 0;
  const cleanCurrent = currentFormula.replace(/\s+/g, '').toLowerCase();

  return (
    <View style={{ gap: 10 }}>
      <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(18) }}>Atalhos</Text>

      {characters.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} accessibilityRole="radiogroup">
          {characters.map((c) => <Chip key={c.id} label={c.name} on={c.id === char?.id} onPress={() => setCharId(c.id)} />)}
        </ScrollView>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} accessibilityRole="tablist">
        {FILTERS.map((f) => <Chip key={f.id} label={f.label} on={filter === f.id} onPress={() => setFilter(f.id)} />)}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 2 }}>
        {loading && <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, alignSelf: 'center' }}>Carregando…</Text>}

        {sheet.map((r) => (
          <Card key={`${r.kind}-${r.id}`} title={r.name} sub={r.attack ? `Atq ${r.attack.replace('1d20', '')} · ${r.formula}` : fmt(r.formula)} tag={`da ficha · ${r.detail}`}>
            {r.attack ? <Go label="Atacar" a11y={`Atacar com ${r.name}`} disabled={rolling} onPress={() => onRoll(r.attack!, `${r.name}: ataque (${char!.name})`)} /> : null}
            <Go label={r.kind === 'item' ? 'Usar' : r.attack ? 'Dano' : 'Rolar'} a11y={`Rolar ${r.name}`} disabled={rolling} onPress={() => onRoll(r.formula, `${r.name} (${char!.name})`)} />
          </Card>
        ))}

        {mine.map((sc) => (
          <Card key={sc.id} title={sc.name} sub={fmt(sc.formula)} tag="personalizado" onRemove={() => onRemove(sc.id)}>
            <Go label="Rolar" a11y={`Rolar ${sc.name}`} disabled={rolling} onPress={() => onRoll(sc.formula, sc.name)} />
          </Card>
        ))}

        {shortcuts.length < MAX_SHORTCUTS && (
          <Pressable onPress={() => setCreating(true)} accessibilityLabel="Novo atalho"
            style={{ width: 160, minHeight: 120, gap: 4, padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.outlineVariant }}>
            <MaterialIcons name="add" size={26} color={COLORS.primary} />
            <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>Novo atalho</Text>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(11), textAlign: 'center' }}>Fórmula exata (ex.: 8d6)</Text>
          </Pressable>
        )}
      </ScrollView>

      {nothing && !char && <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13) }}>Crie uma ficha para ver aqui as armas, magias e itens dela.</Text>}
      <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>
        Itens “da ficha” aparecem sozinhos e usam o status atual do personagem. “Personalizado” rola a fórmula que você digitou.
      </Text>

      {creating && (
        <NewShortcutModal initialFormula={validateFormula(cleanCurrent) ? cleanCurrent : ''} onClose={() => setCreating(false)}
          onSave={async (n, f) => { if (await onCreate(n, f)) { setCreating(false); return true; } return false; }} />
      )}
    </View>
  );
}

function NewShortcutModal({ initialFormula, onClose, onSave }: { initialFormula: string; onClose: () => void; onSave: (name: string, formula: string) => Promise<boolean> }) {
  const [name, setName] = useState('');
  const [formula, setFormula] = useState(initialFormula);
  const [busy, setBusy] = useState(false);
  const clean = formula.replace(/\s+/g, '').toLowerCase();
  const ok = validateFormula(clean);

  async function submit() {
    if (!ok || !name.trim() || busy) return;
    setBusy(true); await onSave(name.trim(), clean); setBusy(false);
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <View accessibilityViewIsModal style={{ gap: 12, padding: 18, borderTopLeftRadius: 18, borderTopRightRadius: 18, backgroundColor: COLORS.surfaceContainerHigh }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(20) }}>Novo atalho</Text>
            <Pressable onPress={onClose} accessibilityLabel="Fechar"><MaterialIcons name="close" size={24} color={COLORS.onSurfaceVariant} /></Pressable>
          </View>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13) }}>
            Armas, magias e itens da ficha aparecem sozinhos na lista, com o bônus do personagem. Aqui você cria um atalho com uma fórmula exata.
          </Text>
          <FormGroup label="Nome">
            <TextInput value={name} onChangeText={setName} maxLength={40} placeholder="Bola de fogo" placeholderTextColor={COLORS.onSurfaceVariant} style={inputStyle()} />
          </FormGroup>
          <FormGroup label="Fórmula exata" error={formula && !ok ? 'Use NdX, NdX+M ou NdX-M com d4, d6, d8, d10, d12, d20 ou d100.' : undefined}
            hint={ok ? '✓ Fórmula válida' : 'Digite a fórmula.'}>
            <TextInput value={formula} onChangeText={setFormula} placeholder="8d6+2" placeholderTextColor={COLORS.onSurfaceVariant} autoCapitalize="none" autoCorrect={false}
              style={inputStyle(!!formula && !ok, ok)} />
          </FormGroup>
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
            <Pressable onPress={onClose} style={{ paddingHorizontal: 16, minHeight: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant }}>
              <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>Cancelar</Text>
            </Pressable>
            <Pressable onPress={submit} disabled={!ok || !name.trim() || busy}
              style={{ paddingHorizontal: 16, minHeight: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, opacity: !ok || !name.trim() || busy ? 0.5 : 1 }}>
              <Text style={{ color: COLORS.onPrimary, fontFamily: BOLD, fontSize: appFontSize(14) }}>{busy ? '…' : 'Salvar atalho'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
