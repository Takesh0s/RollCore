import React, { useEffect, useRef } from 'react';
import {
  Pressable as NativePressable,
  PressableProps,
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  TouchableOpacity as NativeTouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { usePathname } from 'expo-router';
import { fontMultiplier, useAcessibilidade } from '../store/acessibilidade';
import { feedbackDeAcao, nomeDoPapel } from '../utils/acessibilidadeAudio';
import { registrarTextoDaTela } from '../utils/screenNarration';

function scaleStyle(style: TextProps['style'] | TextInputProps['style'], multiplier: number, defaultSize: number) {
  const flattened = StyleSheet.flatten(style) ?? {};
  const baseSize = typeof flattened.fontSize === 'number' ? flattened.fontSize : defaultSize;
  const scaled: TextStyle = { ...flattened, fontSize: Math.max(10, Math.round(baseSize * multiplier)) };
  if (typeof flattened.lineHeight === 'number') scaled.lineHeight = Math.round(flattened.lineHeight * multiplier);
  if (scaled.flexShrink === undefined) scaled.flexShrink = 1;
  return scaled;
}

function childText(node: unknown): string {
  if (typeof node === 'function') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(childText).filter(Boolean).join(' ');
  if (React.isValidElement<{ children?: React.ReactNode; accessibilityLabel?: string }>(node)) {
    const props = node.props as { children?: React.ReactNode; accessibilityLabel?: string; name?: unknown; alt?: unknown };
    if (typeof props.accessibilityLabel === 'string' && props.accessibilityLabel) return props.accessibilityLabel;
    const content = childText(props.children);
    if (content) return content;
    const icon = typeof props.name === 'string' ? props.name : typeof props.alt === 'string' ? props.alt : '';
    return icon ? `Ícone ${icon.replace(/[-_]/g, ' ')}` : '';
  }
  return '';
}

export function AccessibleText(props: TextProps) {
  const pathname = usePathname();
  const id = useRef(`text-${Math.random().toString(36).slice(2)}`);
  const { fonte } = useAcessibilidade();
  const text = props.accessibilityLabel || childText(props.children);
  useEffect(() => {
    if (!text) return;
    return registrarTextoDaTela(pathname, id.current, text, 'text');
  }, [pathname, text]);
  return <NativeText {...props} style={scaleStyle(props.style, fontMultiplier(fonte), 14)} />;
}

export function AccessibleTextInput(props: TextInputProps) {
  const pathname = usePathname();
  const id = useRef(`input-${Math.random().toString(36).slice(2)}`);
  const { fonte } = useAcessibilidade();
  const label = props.accessibilityLabel || props.placeholder || '';
  useEffect(() => {
    if (!label) return;
    return registrarTextoDaTela(pathname, id.current, `Campo ${label}`, 'text');
  }, [pathname, label]);
  return <NativeTextInput {...props} style={scaleStyle(props.style, fontMultiplier(fonte), 16)} />;
}

export function AccessiblePressable(props: PressableProps) {
  const pathname = usePathname();
  const id = useRef(`visual-${Math.random().toString(36).slice(2)}`);
  const { descreverVisuais } = useAcessibilidade();
  const label = props.accessibilityLabel || childText(props.children);
  const role = typeof props.accessibilityRole === 'string' ? props.accessibilityRole : 'controle';
  useEffect(() => {
    if (!descreverVisuais || !label) return;
    return registrarTextoDaTela(pathname, id.current, `${nomeDoPapel(role)}: ${label}`, 'visual');
  }, [pathname, descreverVisuais, label, role]);
  const handlePress: PressableProps['onPress'] = (event) => {
    feedbackDeAcao(label, role, descreverVisuais);
    props.onPress?.(event);
  };
  return <NativePressable {...props} onPress={handlePress} />;
}

export function AccessibleTouchableOpacity(props: TouchableOpacityProps) {
  const pathname = usePathname();
  const id = useRef(`touchable-${Math.random().toString(36).slice(2)}`);
  const { descreverVisuais } = useAcessibilidade();
  const label = props.accessibilityLabel || childText(props.children);
  const role = typeof props.accessibilityRole === 'string' ? props.accessibilityRole : 'botão';
  useEffect(() => {
    if (!descreverVisuais || !label) return;
    return registrarTextoDaTela(pathname, id.current, `${nomeDoPapel(role)}: ${label}`, 'visual');
  }, [pathname, descreverVisuais, label, role]);
  const handlePress: TouchableOpacityProps['onPress'] = (event) => {
    feedbackDeAcao(label, role, descreverVisuais);
    props.onPress?.(event);
  };
  return <NativeTouchableOpacity {...props} onPress={handlePress} />;
}
