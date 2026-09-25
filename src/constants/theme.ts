import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111827',
    background: '#F9FAFB', // Fundo claro alternativo
    backgroundElement: '#E5E7EB',
    backgroundSelected: '#D1D5DB',
    textSecondary: '#4B5563',
    primary: '#D97706', // Dourado escuro para contraste no claro
    border: '#E5E7EB',
  },
  dark: {
    text: '#FFFFFF',
    background: '#0B0F19', // Fundo escuro principal do app (azul muito escuro/preto)
    backgroundElement: '#111827', // Fundo dos cards e inputs
    backgroundSelected: '#1F2937', // Hover/Seleção
    textSecondary: '#9CA3AF', // Textos secundários ou placeholders
    primary: '#FBBF24', // Dourado/Amarelo dos botões e ícones
    border: '#374151', // Linhas e separadores
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif', // Ideal para a tipografia estilo "Aurelian Parchment"
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;