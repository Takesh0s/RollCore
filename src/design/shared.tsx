import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';
import {
  SourceSerif4_600SemiBold,
  SourceSerif4_700Bold,
} from '@expo-google-fonts/source-serif-4';
import { MaterialIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

// Tokens de cor extraídos de aurelian_parchment/DESIGN.md
export const COLORS = {
  background: '#0b1326',
  surface: '#0b1326',
  surfaceContainer: '#171f33',
  surfaceContainerLowest: '#060e20',
  surfaceContainerHigh: '#222a3d',
  surfaceContainerHighest: '#2d3449',
  surfaceBright: '#31394d',
  onSurface: '#dae2fd',
  onSurfaceVariant: '#d5c4ab',
  outline: '#9e8f78',
  outlineVariant: '#514532',
  primary: '#ffdca1',
  onPrimary: '#412d00',
  primaryContainer: '#ffb800',
  onPrimaryContainer: '#6b4c00',
  primaryFixedDim: '#ffba20',
  secondary: '#b9c7e0',
} as const;

export function useAppFonts() {
  const [loaded] = useFonts({
    SourceSerif4_700Bold,
    SourceSerif4_600SemiBold,
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  });
  return loaded;
}

// Logo: círculo com borda dourada translúcida + ícone de dado, igual ao
// header do Stitch (círculo w-24 h-24, border-primary/30, ícone "casino").
export function Logo({ size = 96 }: { size?: number }) {
  return (
    <View
      style={[
        styles.logoCircle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}>
      <MaterialIcons name="casino" size={size * 0.5} color={COLORS.primary} />
    </View>
  );
}

export function Header({
  title,
  onBack,
  rightIcon = 'person',
  onRightPress,
}: {
  title: string;
  onBack?: () => void;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onRightPress?: () => void;
}) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.headerButton} accessibilityLabel="Voltar">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
      ) : (
        <Pressable
          onPress={() => router.push('/(tabs)/skills')}
          style={styles.headerButton}
          accessibilityLabel="Perfil"
        >
          <MaterialIcons name="account-circle" size={26} color={COLORS.primary} />
        </Pressable>
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <Pressable
        onPress={onRightPress}
        style={styles.headerAvatar}
        disabled={!onRightPress}
        accessibilityLabel={rightIcon}
      >
        <MaterialIcons name={rightIcon} size={18} color={COLORS.onPrimary} />
      </Pressable>
    </View>
  );
}

// Fundo cheio da tela + container central (equivalente ao <main> do Stitch).
export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.outer}>
      <View style={styles.main}>{children}</View>
    </View>
  );
}

// Card escuro elevado (equivalente à <section> do formulário no Stitch).
export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

interface FieldProps extends TextInputProps {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  isPassword?: boolean;
}

// Campo com label sempre visível acima (sem floating label, por clareza
// cognitiva — regra do DESIGN.md) e ícone à esquerda.
export function Field({ label, icon, isPassword, style, ...rest }: FieldProps) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color={COLORS.outlineVariant}
            style={styles.fieldIcon}
          />
        )}
        <TextInput
          style={[styles.fieldInput, icon ? { paddingLeft: 44 } : null, style]}
          placeholderTextColor="rgba(213,196,171,0.5)"
          autoCapitalize="none"
          secureTextEntry={isPassword ? hidden : rest.secureTextEntry}
          {...rest}
        />
        {isPassword && (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            style={styles.fieldTrailingIcon}
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}>
            <MaterialIcons
              name={hidden ? 'visibility-off' : 'visibility'}
              size={20}
              color={COLORS.outlineVariant}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  icon,
}: {
  title: string;
  onPress?: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
}) {
  return (
    <Pressable style={styles.primaryButton} onPress={onPress}>
      <Text style={styles.primaryButtonText}>{title}</Text>
      {icon && <MaterialIcons name={icon} size={20} color={COLORS.onPrimary} />}
    </Pressable>
  );
}

export function SecondaryButton({
  title,
  onPress,
  icon,
}: {
  title: string;
  onPress?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <Pressable style={styles.secondaryButton} onPress={onPress}>
      {icon}
      <Text style={styles.secondaryButtonText}>{title}</Text>
    </Pressable>
  );
}

export function LinkText({
  children,
  onPress,
  align = 'left',
}: {
  children: React.ReactNode;
  onPress?: () => void;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignSelf: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
      }}>
      <Text style={styles.linkText}>{children}</Text>
    </Pressable>
  );
}

// Indicador de força de senha: 4 barras + rótulo (ex: "Força: Forte").
// `strength` vai de 0 a 4 (quantas barras ficam preenchidas).
export function PasswordStrength({
  strength,
  label,
  hint = 'Mín. 8 caracteres',
}: {
  strength: number;
  label: string;
  hint?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', gap: 4, height: 6 }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              borderRadius: 3,
              backgroundColor: i < strength ? COLORS.primaryContainer : 'rgba(255,184,0,0.25)',
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialIcons name="shield" size={14} color={COLORS.primary} />
          <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 12 }}>
            {label}
          </Text>
        </View>
        <Text style={{ color: COLORS.secondary, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: 12 }}>
          {hint}
        </Text>
      </View>
    </View>
  );
}

// Barra de navegação inferior reutilizável, inspirada no visual do D&D
// Beyond (ícone + label, aba ativa em destaque) mas com a paleta Aurelian
// Parchment. Use nas telas pós-login que precisam da navegação principal
// (Minhas Mesas = Dashboard, Ficha = Dice, Grimório = Skills, Inventário =
// Vault). Como as rotas saíram do grupo (tabs), essa barra é desenhada à
// mão em cada tela — passe `active` com o nome da aba atual.
export interface BottomNavItem {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
}

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/mesas' },
  { key: 'dice', label: 'Dice', icon: 'casino', route: '/dados' },
  { key: 'skills', label: 'Skills', icon: 'description', route: '/skills' },
  { key: 'vault', label: 'Vault', icon: 'inventory', route: '/vault' },
];

export function BottomNavBar({ active, onNavigate }: { active: string; onNavigate: (route: string) => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 72,
        paddingBottom: 8,
        paddingTop: 6,
        borderTopWidth: 2,
        borderTopColor: 'rgba(255,220,161,0.3)',
        backgroundColor: COLORS.background,
      }}>
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isActive = item.key === active;
        return (
          <Pressable
            key={item.key}
            onPress={() => onNavigate(item.route)}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              minWidth: 64,
              paddingHorizontal: isActive ? 16 : 8,
              paddingVertical: isActive ? 6 : 2,
              borderRadius: 999,
              backgroundColor: isActive ? COLORS.primaryContainer : 'transparent',
            }}>
            <MaterialIcons
              name={item.icon}
              size={22}
              color={isActive ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant}
            />
            <Text
              style={{
                fontFamily: 'AtkinsonHyperlegible_700Bold',
                fontSize: 11,
                color: isActive ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant,
              }}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Toggle (switch) com label e descrição opcional — usado em Configurações
// e Acessibilidade Visual.
export function Toggle({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        backgroundColor: COLORS.surfaceContainer,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(158,143,120,0.3)',
      }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: 15 }}>
          {label}
        </Text>
        {description ? (
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: 13 }}>
            {description}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={() => onValueChange(!value)}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        style={{
          width: 52,
          height: 30,
          borderRadius: 15,
          padding: 3,
          backgroundColor: value ? COLORS.primary : COLORS.surfaceContainerHighest,
          justifyContent: 'center',
          alignItems: value ? 'flex-end' : 'flex-start',
        }}>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: value ? COLORS.onPrimary : COLORS.onSurfaceVariant,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {value ? <MaterialIcons name="check" size={14} color={COLORS.primary} /> : null}
        </View>
      </Pressable>
    </View>
  );
}

// Controle segmentado (ex: Pequeno/Padrão/Grande, Lenta/Normal/Rápida).
export function SegmentedControl({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (opt: string) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 4,
        backgroundColor: COLORS.surfaceContainerLowest,
        borderRadius: 8,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(158,143,120,0.3)',
      }}>
      {options.map((opt) => {
        const active = opt === selected;
        return (
          <Pressable
            key={opt}
            onPress={() => onSelect(opt)}
            style={{
              flex: 1,
              minHeight: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              backgroundColor: active ? COLORS.primaryContainer : 'transparent',
            }}>
            <Text
              style={{
                fontFamily: 'AtkinsonHyperlegible_700Bold',
                fontSize: 13,
                color: active ? COLORS.onPrimaryContainer : COLORS.onSurfaceVariant,
              }}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Divider({ label = 'ou' }: { label?: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(11,19,38,0.8)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.onSurface,
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: 22,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  main: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: 24,
    justifyContent: 'center',
    gap: 32,
  },
  logoCircle: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 2,
    borderColor: 'rgba(255,220,161,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 12,
    borderTopWidth: 2,
    borderTopColor: 'rgba(255,220,161,0.2)',
    padding: 24,
    gap: 16,
  },
  fieldWrapper: {
    gap: 4,
  },
  fieldLabel: {
    color: COLORS.onSurfaceVariant,
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    paddingLeft: 4,
  },
  fieldRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  fieldIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  fieldTrailingIcon: {
    position: 'absolute',
    right: 16,
  },
  fieldInput: {
    minHeight: 48,
    backgroundColor: COLORS.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 16,
    color: COLORS.onSurface,
    fontFamily: 'AtkinsonHyperlegible_400Regular',
    fontSize: 16,
  },
  primaryButton: {
    minHeight: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: COLORS.onPrimary,
    fontFamily: 'SourceSerif4_600SemiBold',
    fontSize: 17,
    textAlign: 'center',
    flexShrink: 1,
  },
  secondaryButton: {
    minHeight: 48,
    backgroundColor: COLORS.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: 'rgba(158,143,120,0.3)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButtonText: {
    color: COLORS.onSurface,
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
  },
  linkText: {
    color: COLORS.primary,
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(81,69,50,0.3)',
  },
  dividerLabel: {
    color: COLORS.outline,
    fontFamily: 'AtkinsonHyperlegible_700Bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
});
