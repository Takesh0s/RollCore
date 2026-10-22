import { appFontSize } from '../design/shared';
import { useAcessibilidade } from '../store/acessibilidade';
import { Platform, StyleSheet, Text as NativeText, type TextProps } from 'react-native';
import { AccessibleText as Text } from './accessible-text';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  useAcessibilidade();
  const fontSize = type === 'title' ? 48 : type === 'subtitle' ? 32 : type === 'code' ? 12 : type === 'default' ? 16 : 14;

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        { fontSize: appFontSize(fontSize) },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: appFontSize(14),
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: appFontSize(14),
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: appFontSize(16),
    lineHeight: 24,
    fontWeight: 500,
  },
  title: {
    fontSize: appFontSize(48),
    fontWeight: 600,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: appFontSize(32),
    lineHeight: 44,
    fontWeight: 600,
  },
  link: {
    lineHeight: 30,
    fontSize: appFontSize(14),
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: appFontSize(14),
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: appFontSize(12),
  },
});
