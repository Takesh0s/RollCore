import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../accessible-text';
import { Chip, FormGroup, inputStyle } from '../Controls';
import { COLORS, appFontSize } from '../../design/shared';
import { VALID_SIDES } from '../../lib/dice';
import { useDice } from '../../store/useDice';
import { useQuickRoll } from '../../store/useQuickRoll';
import { showToast } from '../../store/useToast';
import type { HistoryEntry } from '../../types';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';

/** Rolagem rápida: escolhe o dado, soma um modificador e rola sem sair da tela atual. Montada no layout raiz. */
export function QuickRollModal() {
  const { open, setOpen } = useQuickRoll();
  const router = useRouter();
  const roll = useDice((s) => s.roll);
  const [sides, setSides] = useState<number>(20);
  const [mod, setMod] = useState('0');
  const [last, setLast] = useState<HistoryEntry | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;
  const modifier = Number.parseInt(mod, 10) || 0;

  async function doRoll() {
    setBusy(true);
    const formula = `1d${sides}${modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : ''}`;
    const res = await roll({ formula });
    setBusy(false);
    if (res.ok) setLast(res.value); else showToast(res.error, 'error');
  }

  const r = last?.result;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 420, gap: 14, padding: 20, borderRadius: 16, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
          <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(22) }}>Rolar dados</Text>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {VALID_SIDES.map((s) => <Chip key={s} label={`d${s}`} on={sides === s} onPress={() => setSides(s)} />)}
          </View>
          <FormGroup label="Modificador">
            <TextInput value={mod} onChangeText={(t) => setMod(t.replace(/[^\d-]/g, ''))} keyboardType="numbers-and-punctuation" style={[inputStyle(), { textAlign: 'center' }]} />
          </FormGroup>
          {r && (
            <View accessibilityLiveRegion="polite" accessible accessibilityLabel={`Resultado ${r.total}`} style={{ alignItems: 'center', gap: 2, paddingVertical: 8 }}>
              <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(48) }}>{r.total}</Text>
              <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(13) }}>
                d{r.sides} ({r.rolls.join(', ')}){r.mod ? ` ${r.mod > 0 ? '+' : '−'} ${Math.abs(r.mod)}` : ''}
              </Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable onPress={() => { setOpen(false); router.push('/dados' as any); }} style={{ flex: 1, minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant }}>
              <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>Histórico</Text>
            </Pressable>
            <Pressable onPress={doRoll} disabled={busy} style={{ flex: 1, minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, opacity: busy ? 0.6 : 1 }}>
              <Text style={{ color: COLORS.onPrimary, fontFamily: BOLD, fontSize: appFontSize(14) }}>{r ? 'Rolar de novo' : 'Rolar'}</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => setOpen(false)} accessibilityLabel="Fechar" style={{ alignItems: 'center', paddingVertical: 4 }}>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BOLD, fontSize: appFontSize(13) }}>Fechar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
