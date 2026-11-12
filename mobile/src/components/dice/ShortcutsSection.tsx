import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../accessible-text';
import { BODY, BOLD, CRIT, DiceChip, DiceTitle, FAIL, SERIF, ChipRow, fieldStyle } from './parts';
import { COLORS, appFontSize } from '../../design/shared';
import { validateFormula } from '../../lib/dice';
import { fetchCharacterSpells } from '../../lib/characters';
import { itemRollables, spellRollables, type Rollable } from '../../lib/weapons';
import { request } from '../../services/api';
import type { Character, DiceShortcut, InventoryApiResponse } from '../../types';

type Filter = 'all' | 'weapon' | 'spell' | 'item' | 'mine';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' }, { id: 'weapon', label: 'Armas' }, { id: 'spell', label: 'Magias' },
  { id: 'item', label: 'Itens' }, { id: 'mine', label: 'Meus' },
];
const MAX_SHORTCUTS = 12;
const fmt = (f: string) => f.replace(/([+-])/g, ' $1 ');
const groupOf = (r: Rollable): Filter => (r.kind === 'weapon' ? 'weapon' : r.kind === 'item' ? 'item' : 'spell');

/** `.dice-shortcut`: cartão transparente com contorno, 2 por linha. */
function Card({ title, sub, tag, tagColor, children, onRemove, dashed, onPress }: {
  title: string; sub?: string; tag: string; tagColor?: string; children?: React.ReactNode; onRemove?: () => void; dashed?: boolean; onPress?: () => void;
}) {
  const Wrap: any = onPress ? Pressable : View;
  return (
    <Wrap onPress={onPress} accessibilityLabel={onPress ? title : undefined}
      style={{ width: '48.5%', minHeight: 88, gap: 4, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: dashed ? 1.5 : 1, borderStyle: dashed ? 'dashed' : 'solid',
        borderColor: COLORS.outlineVariant, justifyContent: dashed ? 'center' : undefined }}>
      <Text numberOfLines={1} style={{ color: '#FFFFFF', fontFamily: SERIF, fontSize: appFontSize(14), paddingRight: onRemove ? 16 : 0 }}>{title}</Text>
      {sub ? <Text style={{ color: COLORS.sapphire, fontFamily: BOLD, fontSize: appFontSize(13) }}>{sub}</Text> : null}
      <Text numberOfLines={1} style={{ color: tagColor ?? COLORS.sapphire, fontFamily: BODY, fontSize: appFontSize(10) }}>{tag}</Text>
      {children ? <View style={{ flexDirection: 'row', gap: 10, marginTop: 'auto' }}>{children}</View> : null}
      {onRemove ? (
        <Pressable onPress={onRemove} accessibilityLabel={`Remover atalho ${title}`} hitSlop={8} style={{ position: 'absolute', top: 4, right: 8 }}>
          <Text style={{ color: '#C0C0C0', fontSize: appFontSize(18), lineHeight: 22 }}>×</Text>
        </Pressable>
      ) : null}
    </Wrap>
  );
}

function Go({ label, onPress, disabled, a11y }: { label: string; onPress: () => void; disabled: boolean; a11y: string }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityLabel={a11y} style={{ opacity: disabled ? 0.5 : 1 }}>
      <Text style={{ color: '#C0C0C0', fontFamily: BODY, fontSize: appFontSize(11) }}>{label} ›</Text>
    </Pressable>
  );
}

/** Atalhos (web ShortcutsSection): o que a ficha tem (armas, magias, itens) e as fórmulas salvas. */
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
    <View>
      <DiceTitle>Atalhos</DiceTitle>

      {characters.length > 0 && (
        <ChipRow>{characters.map((c) => <DiceChip key={c.id} label={c.name} on={c.id === char?.id} onPress={() => setCharId(c.id)} />)}</ChipRow>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
        <ChipRow scroll>{FILTERS.map((f) => <DiceChip key={f.id} label={f.label} on={filter === f.id} onPress={() => setFilter(f.id)} />)}</ChipRow>
      </ScrollView>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
        {loading && <Text style={{ color: '#C0C0C0', fontFamily: BODY, fontSize: appFontSize(14), width: '100%', textAlign: 'center', paddingVertical: 10 }}>Carregando…</Text>}

        {sheet.map((r) => (
          <Card key={`${r.kind}-${r.id}`} title={r.name} sub={r.attack ? `Atq ${r.attack.replace('1d20', '')} · ${r.formula}` : fmt(r.formula)} tag={`● da ficha · ${r.detail}`} tagColor={CRIT}>
            {r.attack ? <Go label="Atacar" a11y={`Atacar com ${r.name}`} disabled={rolling} onPress={() => onRoll(r.attack!, `${r.name}: ataque (${char!.name})`)} /> : null}
            <Go label={r.kind === 'item' ? 'Usar' : r.attack ? 'Dano' : 'Rolar'} a11y={`Rolar ${r.name}`} disabled={rolling} onPress={() => onRoll(r.formula, `${r.name} (${char!.name})`)} />
          </Card>
        ))}

        {mine.map((sc) => (
          <Card key={sc.id} title={sc.name} sub={fmt(sc.formula)} tag="◆ personalizado" onRemove={() => onRemove(sc.id)}>
            <Go label="Rolar" a11y={`Rolar ${sc.name}`} disabled={rolling} onPress={() => onRoll(sc.formula, sc.name)} />
          </Card>
        ))}

        {shortcuts.length < MAX_SHORTCUTS && (
          <Card dashed title="+ Novo atalho" tag="Fórmula exata (ex.: 8d6)" onPress={() => setCreating(true)} />
        )}
      </View>

      {nothing && !char && <Text style={{ color: '#C0C0C0', fontFamily: BODY, fontSize: appFontSize(14), textAlign: 'center', paddingVertical: 10 }}>Crie uma ficha para ver aqui as armas, magias e itens dela.</Text>}
      <Text style={{ color: '#C0C0C0', fontFamily: BODY, fontSize: appFontSize(11), marginTop: 8, marginBottom: 4 }}>
        Itens “da ficha” aparecem sozinhos e usam o status atual do personagem. “Personalizado” rola a fórmula que você digitou.
      </Text>

      {creating && (
        <NewShortcutModal initialFormula={validateFormula(cleanCurrent) ? cleanCurrent : ''} onClose={() => setCreating(false)}
          onSave={async (n, f) => { if (await onCreate(n, f)) { setCreating(false); return true; } return false; }} />
      )}
    </View>
  );
}

/** `.dice-modal`: cartão centralizado sobre fundo escurecido. */
function NewShortcutModal({ initialFormula, onClose, onSave }: { initialFormula: string; onClose: () => void; onSave: (name: string, formula: string) => Promise<boolean> }) {
  const [name, setName] = useState('');
  const [formula, setFormula] = useState(initialFormula);
  const [busy, setBusy] = useState(false);
  const clean = formula.replace(/\s+/g, '').toLowerCase();
  const ok = validateFormula(clean);
  const can = ok && !!name.trim() && !busy;

  async function submit() {
    if (!can) return;
    setBusy(true); await onSave(name.trim(), clean); setBusy(false);
  }

  const label = { color: '#C0C0C0', fontFamily: BODY, fontSize: appFontSize(12) } as const;
  const btn = (fill: boolean, off?: boolean) => ({ flex: 1, height: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.sapphire, backgroundColor: fill ? COLORS.sapphire : 'transparent', opacity: off ? 0.5 : 1 } as const);

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center', padding: 16, backgroundColor: 'rgba(8,12,14,0.62)' }}>
        <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 380, alignSelf: 'center', gap: 12, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: COLORS.outlineVariant, backgroundColor: COLORS.surfaceContainer }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text accessibilityRole="header" style={{ color: '#FFFFFF', fontFamily: SERIF, fontSize: appFontSize(20) }}>Novo atalho</Text>
            <Pressable onPress={onClose} accessibilityLabel="Fechar"><Text style={{ color: '#C0C0C0', fontSize: appFontSize(18) }}>✕</Text></Pressable>
          </View>
          <Text style={{ ...label }}>Armas, magias e itens que você já criou no site aparecem sozinhos na lista, com o bônus da ficha. Aqui você cria um atalho com uma fórmula exata.</Text>
          <View style={{ gap: 4 }}>
            <Text style={label}>Nome</Text>
            <TextInput value={name} onChangeText={setName} maxLength={40} placeholder="Bola de fogo" placeholderTextColor={COLORS.placeholder} style={fieldStyle()} />
          </View>
          <View style={{ gap: 4 }}>
            <Text style={label}>Fórmula exata</Text>
            <TextInput value={formula} onChangeText={setFormula} placeholder="8d6+2" placeholderTextColor={COLORS.placeholder} autoCapitalize="none" autoCorrect={false} style={fieldStyle(!!formula && !ok)} />
          </View>
          <Text style={{ color: ok ? CRIT : FAIL, fontFamily: BODY, fontSize: appFontSize(12) }}>
            {ok ? '✓ Fórmula válida' : formula ? 'Use NdX, NdX+M ou NdX-M com d4, d6, d8, d10, d12, d20 ou d100.' : 'Digite a fórmula.'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Pressable onPress={onClose} accessibilityRole="button" style={btn(false)}><Text style={{ color: COLORS.sapphire, fontFamily: BOLD, fontSize: appFontSize(14) }}>Cancelar</Text></Pressable>
            <Pressable onPress={submit} disabled={!can} accessibilityRole="button" style={btn(true, !can)}><Text style={{ color: '#10202E', fontFamily: BOLD, fontSize: appFontSize(14) }}>Salvar atalho</Text></Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
