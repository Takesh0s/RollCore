import { MaterialIcons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable as NativePressable, ScrollView, View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from './accessible-text';
import { COLORS, appFontSize } from '../design/shared';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';
const SERIF = 'SourceSerif4_700Bold';

/** Round portrait: the photo when there is one, otherwise the initial of the name. */
export function Avatar({ uri, name, size = 56 }: { uri?: string | null; name: string; size?: number }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
        backgroundColor: COLORS.surfaceContainerHighest, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
      {uri
        ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
        : <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: size * 0.42 }}>{(name.trim().charAt(0) || '?').toUpperCase()}</Text>}
    </View>
  );
}

/** Label + error line around a form control. */
export function FormGroup({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>{label}</Text>
      {children}
      {hint && !error ? <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{hint}</Text> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={{ color: '#e57373', fontFamily: BODY, fontSize: appFontSize(12) }}>{error}</Text> : null}
    </View>
  );
}

export function inputStyle(error?: boolean, valid?: boolean) {
  return {
    minHeight: 48, borderRadius: 10, paddingHorizontal: 14, fontFamily: BODY, fontSize: appFontSize(16),
    backgroundColor: COLORS.field, color: COLORS.fieldText,
    borderWidth: 1, borderColor: error ? '#e05555' : valid ? 'rgba(74,222,128,0.5)' : COLORS.outlineVariant,
  } as const;
}

interface SelectProps {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  title: string;
  disabled?: boolean;
  /** Free text allowed (system "Personalizado"): the sheet also offers a field to type a custom value. */
  custom?: boolean;
  /** Options that cannot be picked, with the suffix shown after them. */
  disabledOptions?: Record<string, string>;
  error?: boolean;
  allowClear?: boolean;
}

/** Field that opens a bottom sheet with the options; with `custom` it also accepts typed text. */
export function Select({ value, options, onChange, placeholder = 'Selecione...', title, disabled, custom, disabledOptions, error, allowClear }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const pick = (v: string) => { onChange(v); setOpen(false); };
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`${title}: ${value || 'nenhum selecionado'}`} disabled={disabled}
        onPress={() => { setTyped(''); setOpen(true); }}
        style={[inputStyle(error, !!value), { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: disabled ? 0.5 : 1 }]}>
        <Text numberOfLines={1} style={{ color: value ? COLORS.onSurface : COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(16), flex: 1 }}>{value || placeholder}</Text>
        <MaterialIcons name="expand-more" size={22} color={COLORS.onSurfaceVariant} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <NativePressable style={{ flex: 1 }} onPress={() => setOpen(false)} accessibilityLabel="Fechar" />
          <View style={{ maxHeight: '78%', backgroundColor: COLORS.surfaceContainerHigh, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(19) }}>{title}</Text>
              <Pressable onPress={() => setOpen(false)} accessibilityLabel="Fechar"><MaterialIcons name="close" size={24} color={COLORS.onSurfaceVariant} /></Pressable>
            </View>
            {custom && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput value={typed} onChangeText={setTyped} placeholder="Digite um nome" placeholderTextColor={COLORS.placeholder} maxLength={50}
                  style={[inputStyle(), { flex: 1 }]} autoCapitalize="words" />
                <Pressable disabled={!typed.trim()} onPress={() => pick(typed.trim())} accessibilityLabel="Usar o nome digitado"
                  style={{ paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, opacity: typed.trim() ? 1 : 0.4 }}>
                  <Text style={{ color: COLORS.onPrimary, fontFamily: BOLD, fontSize: appFontSize(14) }}>Usar</Text>
                </Pressable>
              </View>
            )}
            <ScrollView keyboardShouldPersistTaps="handled">
              {allowClear && value ? (
                <Pressable onPress={() => pick('')} style={{ paddingVertical: 13 }}>
                  <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(15) }}>Limpar seleção</Text>
                </Pressable>
              ) : null}
              {options.map((o) => {
                const off = disabledOptions?.[o];
                const on = o === value;
                return (
                  <Pressable key={o} disabled={off !== undefined} onPress={() => pick(o)} accessibilityState={{ selected: on, disabled: off !== undefined }}
                    style={{ paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: off !== undefined ? 0.45 : 1,
                      borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant }}>
                    <Text style={{ color: on ? COLORS.primary : COLORS.onSurface, fontFamily: on ? BOLD : BODY, fontSize: appFontSize(16) }}>{o}{off ? ` ${off}` : ''}</Text>
                    {on ? <MaterialIcons name="check" size={20} color={COLORS.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

/** Confirmation dialog ("Excluir personagem", "Descartar alterações"). */
export function ConfirmDialog({ visible, title, message, confirmLabel, cancelLabel = 'Cancelar', danger, busy, onConfirm, onCancel }: {
  visible: boolean; title: string; message: string; confirmLabel: string; cancelLabel?: string; danger?: boolean; busy?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 420, borderRadius: 16, padding: 20, gap: 12, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
          <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(20) }}>{title}</Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(15) }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Pressable onPress={onCancel} disabled={busy} style={{ paddingHorizontal: 16, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant }}>
              <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(14) }}>{cancelLabel}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} disabled={busy} style={{ paddingHorizontal: 16, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: danger ? '#c0392b' : COLORS.primary, opacity: busy ? 0.6 : 1 }}>
              <Text style={{ color: danger ? '#fff' : COLORS.onPrimary, fontFamily: BOLD, fontSize: appFontSize(14) }}>{busy ? '…' : confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Loading / error / empty block for lists. */
export function StateBlock({ icon, title, text, actionLabel, onAction }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; text?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 42, paddingHorizontal: 12, gap: 10 }}>
      <MaterialIcons name={icon} size={46} color={COLORS.outline} />
      <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_600SemiBold', fontSize: appFontSize(18), textAlign: 'center' }}>{title}</Text>
      {text ? <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14), textAlign: 'center' }}>{text}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={{ marginTop: 6, paddingHorizontal: 20, minHeight: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.btn }}>
          <Text style={{ color: COLORS.btnText, fontFamily: BODY, fontSize: appFontSize(15) }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Selectable pill used for filters and option groups. */
export function Chip({ label, on, onPress, accessibilityLabel }: { label: string; on: boolean; onPress: () => void; accessibilityLabel?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: on, selected: on }} accessibilityLabel={accessibilityLabel ?? label}
      style={{ paddingHorizontal: 15, minHeight: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
        backgroundColor: on ? COLORS.sapphire : 'transparent', borderWidth: 1, borderColor: on ? COLORS.sapphire : COLORS.outlineVariant }}>
      <Text numberOfLines={1} style={{ color: on ? '#10202E' : COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(13) }}>{label}</Text>
    </Pressable>
  );
}

/** Título de seção do web: texto em serifa centralizado com um filete de cada lado (ou só à direita, com `align="start"`). */
export function SectionTitle({ children, align = 'center' }: { children: string; align?: 'center' | 'start' }) {
  const line = { flex: 1, height: 1, backgroundColor: COLORS.outlineVariant } as const;
  return (
    <View accessibilityRole="header" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
      {align === 'center' && <View style={line} />}
      <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(15) }}>{children}</Text>
      <View style={line} />
    </View>
  );
}

/** Botão de texto (primário, contorno ou perigo). */
export function Btn({ label, onPress, kind = 'outline', disabled, accessibilityLabel }: {
  label: string; onPress: () => void; kind?: 'primary' | 'outline' | 'danger'; disabled?: boolean; accessibilityLabel?: string;
}) {
  // Primário: escuro com brilho claro, como no web; contorno: translúcido com borda prateada.
  const primary = kind === 'primary';
  const bg = primary ? COLORS.btn : kind === 'outline' ? 'rgba(255,255,255,0.08)' : 'transparent';
  const fg = primary ? COLORS.btnText : kind === 'danger' ? '#e57373' : COLORS.onSurfaceVariant;
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}
      style={{ minHeight: 44, paddingHorizontal: 22, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: bg,
        borderWidth: primary ? 0 : 1, borderColor: kind === 'danger' ? '#e57373' : 'rgba(192,192,192,0.5)', opacity: disabled ? 0.55 : 1,
        ...(primary && !disabled ? { shadowColor: '#fff', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 0 } : null) }}>
      <Text style={{ color: fg, fontFamily: BODY, fontSize: appFontSize(15) }}>{label}</Text>
    </Pressable>
  );
}

/** Folha que sobe de baixo com título e botão de fechar. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Fechar" />
        <View accessibilityViewIsModal style={{ maxHeight: '90%', padding: 18, borderTopLeftRadius: 18, borderTopRightRadius: 18, backgroundColor: COLORS.surfaceContainerHigh }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text accessibilityRole="header" numberOfLines={1} style={{ flex: 1, color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(20) }}>{title}</Text>
            <Pressable onPress={onClose} accessibilityLabel="Fechar"><MaterialIcons name="close" size={24} color={COLORS.onSurfaceVariant} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}


/** Campo de senha com botão de mostrar/ocultar. */
export function PasswordField({ value, onChangeText, label, error, autoComplete = 'current-password' }: {
  value: string; onChangeText: (t: string) => void; label: string; error?: boolean; autoComplete?: 'current-password' | 'new-password';
}) {
  const [shown, setShown] = useState(false);
  return (
    <View>
      <TextInput value={value} onChangeText={onChangeText} secureTextEntry={!shown} autoCapitalize="none" autoCorrect={false}
        autoComplete={autoComplete} accessibilityLabel={label} style={[inputStyle(error), { paddingRight: 48 }]} />
      <Pressable onPress={() => setShown((v) => !v)} accessibilityRole="button" accessibilityLabel={shown ? 'Ocultar senha' : 'Mostrar senha'}
        style={{ position: 'absolute', right: 0, top: 0, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons name={shown ? 'visibility-off' : 'visibility'} size={22} color={COLORS.onSurfaceVariant} />
      </Pressable>
    </View>
  );
}
