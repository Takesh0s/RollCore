import { MaterialIcons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from './accessible-text';
import { OutlineText } from './OutlineText';
import { RollCoreLogo } from './RollCoreLogo';
import { AUTH_COLORS, COLORS, appFontSize } from '../design/shared';

const BODY = 'Inter_400Regular';
const BOLD = 'Inter_700Bold';
const FAIL = '#e05555';
const BTN = 'FugazOne_400Regular';
const SERIF = 'SourceSerif4_700Bold';
const FAINT = '#9AA4A8';
const SAPPHIRE = '#8FB8DE';

/** Moldura das telas de acesso (Login, Cadastro, Recuperar senha), como no web: logo, nome, subtítulo e o formulário. */
export function AuthShell({ subtitle, children }: { subtitle: string; children: ReactNode }) {
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: AUTH_COLORS.canvas }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center', paddingHorizontal: 14, paddingTop: 40, paddingBottom: 16 }}>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ marginBottom: 4 }}><RollCoreLogo size={108} color={AUTH_COLORS.mint} /></View>
              <OutlineText size={appFontSize(50)} color={AUTH_COLORS.mint}>RollCore</OutlineText>
              <Text style={{ color: '#C0C0C0', fontFamily: BODY, fontSize: appFontSize(16), marginTop: 4 }}>{subtitle}</Text>
            </View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  valid?: boolean;
  /** Campo de senha, com o olho de mostrar/ocultar. */
  password?: boolean;
}

/** Campo com rótulo, borda vermelha/verde e mensagem de erro logo abaixo, como no web. */
export function AuthField({ label, error, valid, password, ...rest }: FieldProps) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: FAINT, fontFamily: BODY, fontSize: appFontSize(12), marginBottom: 6 }}>{label}</Text>
      <View>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={AUTH_COLORS.placeholder}
          autoCapitalize="none"
          secureTextEntry={password ? hidden : undefined}
          {...rest}
          style={{ height: 44, paddingVertical: 0, paddingHorizontal: 16, paddingRight: password ? 48 : 16, borderRadius: 12, borderWidth: 1, backgroundColor: AUTH_COLORS.field, color: AUTH_COLORS.typed, fontFamily: BODY, fontSize: appFontSize(14),
            borderColor: error ? FAIL : valid ? AUTH_COLORS.mint : 'transparent' }}
        />
        {password && (
          <Pressable onPress={() => setHidden((v) => !v)} accessibilityRole="button" accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'} hitSlop={8}
            style={{ position: 'absolute', right: 8, top: 0, bottom: 0, width: 36, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name={hidden ? 'visibility' : 'visibility-off'} size={22} color={AUTH_COLORS.typed} />
          </Pressable>
        )}
      </View>
      {!!error && <Text accessibilityRole="alert" style={{ color: FAIL, fontFamily: BODY, fontSize: appFontSize(12), marginTop: 4 }}>{error}</Text>}
    </View>
  );
}

/** Botão principal das telas de acesso (arredondado; apagado quando desabilitado). */
export function AuthButton({ label, onPress, disabled, busy }: { label: string; onPress: () => void; disabled?: boolean; busy?: boolean }) {
  const off = disabled || busy;
  return (
    <Pressable onPress={onPress} disabled={off} accessibilityRole="button" accessibilityState={{ disabled: off, busy }}
      style={{ height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: AUTH_COLORS.button, borderWidth: 1, borderColor: SAPPHIRE, opacity: off ? 0.55 : 1,
        shadowColor: SAPPHIRE, shadowOpacity: off ? 0 : 0.55, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: off ? 0 : 6 }}>
      <Text style={{ color: COLORS.btnText, fontFamily: BTN, fontSize: appFontSize(15) }}>{busy ? '…' : label}</Text>
    </Pressable>
  );
}

/** Link sublinhado (texto de apoio + ação), como "Ainda não tem conta? Criar conta". */
export function AuthLink({ label, onPress, hint, align = 'center' }: { label: string; onPress: () => void; hint?: string; align?: 'center' | 'start' }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start', gap: 5, marginTop: 22 }}>
      {!!hint && <Text style={{ color: FAINT, fontFamily: BODY, fontSize: appFontSize(13) }}>{hint}</Text>}
      <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8}>
        <Text style={{ color: SAPPHIRE, fontFamily: SERIF, fontSize: appFontSize(13) }}>{label}</Text>
      </Pressable>
    </View>
  );
}

/** Divisor "ou" entre o botão principal e o Google, como no web. */
export function AuthDivider() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, marginBottom: 14 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(192,192,192,0.5)' }} />
      <Text style={{ color: FAINT, fontFamily: BODY, fontSize: appFontSize(11) }}>ou</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(192,192,192,0.5)' }} />
    </View>
  );
}
