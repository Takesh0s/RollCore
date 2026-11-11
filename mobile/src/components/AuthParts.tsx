import { MaterialIcons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from './accessible-text';
import { RollCoreLogo } from './RollCoreLogo';
import { AUTH_COLORS, appFontSize } from '../design/shared';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';
const FAIL = '#e05555';

/** Moldura das telas de acesso (Login, Cadastro, Recuperar senha), como no web: logo, nome, subtítulo e o formulário. */
export function AuthShell({ subtitle, children }: { subtitle: string; children: ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AUTH_COLORS.canvas }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ width: '100%', maxWidth: 420, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 36, paddingBottom: 30, backgroundColor: AUTH_COLORS.panel, borderWidth: 1, borderColor: AUTH_COLORS.gray, gap: 4 }}>
            <View style={{ alignItems: 'center', marginBottom: 22 }}>
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ marginBottom: 14 }}><RollCoreLogo size={72} color={AUTH_COLORS.mint} /></View>
              <Text accessibilityRole="header" style={{ color: AUTH_COLORS.mint, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(30), letterSpacing: 3 }}>RollCore</Text>
              <Text style={{ color: AUTH_COLORS.white, opacity: 0.8, fontFamily: BODY, fontSize: appFontSize(16), marginTop: 2 }}>{subtitle}</Text>
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
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: AUTH_COLORS.white, opacity: 0.8, fontFamily: BODY, fontSize: appFontSize(13), marginBottom: 6 }}>{label}</Text>
      <View>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={AUTH_COLORS.placeholder}
          autoCapitalize="none"
          secureTextEntry={password ? hidden : undefined}
          {...rest}
          style={{ minHeight: 48, paddingHorizontal: 14, paddingRight: password ? 46 : 14, borderRadius: 12, borderWidth: 1, backgroundColor: AUTH_COLORS.field, color: AUTH_COLORS.typed, fontFamily: BODY, fontSize: appFontSize(16),
            borderColor: error ? FAIL : valid ? 'rgba(74,222,128,0.4)' : AUTH_COLORS.gray }}
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
      style={{ minHeight: 50, marginTop: 6, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: AUTH_COLORS.button, borderWidth: 1, borderColor: AUTH_COLORS.gray, opacity: off ? 0.6 : 1 }}>
      <Text style={{ color: AUTH_COLORS.white, fontFamily: BOLD, fontSize: appFontSize(17) }}>{busy ? '…' : label}</Text>
    </Pressable>
  );
}

/** Link sublinhado (texto de apoio + ação), como "Ainda não tem conta? Criar conta". */
export function AuthLink({ label, onPress, hint, align = 'center' }: { label: string; onPress: () => void; hint?: string; align?: 'center' | 'start' }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start', gap: 5, marginTop: 14 }}>
      {!!hint && <Text style={{ color: AUTH_COLORS.white, opacity: 0.8, fontFamily: BODY, fontSize: appFontSize(14) }}>{hint}</Text>}
      <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8}>
        <Text style={{ color: AUTH_COLORS.mint, fontFamily: BOLD, fontSize: appFontSize(14), textDecorationLine: 'underline' }}>{label}</Text>
      </Pressable>
    </View>
  );
}
