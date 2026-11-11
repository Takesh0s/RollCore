import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from './accessible-text';
import { StateBlock, inputStyle } from './Controls';
import { COLORS, appFontSize } from '../design/shared';
import { useCharacters } from '../store/useCharacters';
import { useQuickRoll } from '../store/useQuickRoll';
import { useQuickSearch } from '../store/useQuickSearch';
import { useTables } from '../store/useTables';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

interface Hit { id: string; icon: keyof typeof MaterialIcons.glyphMap; title: string; sub: string; run: () => void }

/** Busca rápida (mesmo conteúdo do web): mesas, fichas e comandos, sem acento e até 8 resultados. */
export function QuickSearchModal() {
  const { open, setOpen } = useQuickSearch();
  if (!open) return null;
  return <Content onClose={() => setOpen(false)} />;
}

function Content({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const tables = useTables((s) => s.tables);
  const characters = useCharacters((s) => s.characters);
  const [query, setQuery] = useState('');

  // As listas costumam estar carregadas pelo Início, mas a busca também abre de outras telas.
  useEffect(() => {
    if (!useTables.getState().loaded) void useTables.getState().load();
    if (!useCharacters.getState().loaded) void useCharacters.getState().load();
  }, []);

  const hits = useMemo<Hit[]>(() => {
    const go = (fn: () => void) => () => { onClose(); fn(); };
    const push = (path: string) => go(() => router.push(path as any));
    const all: Hit[] = [
      ...tables.map((t) => ({ id: `t-${t.id}`, icon: 'groups' as const, title: t.name, sub: `Mesa · ${t.gameSystem}`, run: push(`/sessao/${t.id}`) })),
      ...characters.map((c) => ({
        id: `c-${c.id}`, icon: 'description' as const, title: c.name,
        sub: `Ficha · ${[c.class, c.race].filter(Boolean).join(' · ')} · Nível ${c.level}`, run: push(`/personagens?id=${c.id}`),
      })),
      { id: 'k-char', icon: 'add', title: 'Criar nova ficha', sub: 'Comando', run: push('/criar-personagem') },
      { id: 'k-table', icon: 'add', title: 'Criar nova mesa', sub: 'Comando', run: push('/mesa') },
      { id: 'k-roll', icon: 'casino', title: 'Rolar dados', sub: 'Comando', run: go(() => useQuickRoll.getState().setOpen(true)) },
      { id: 'k-cal', icon: 'event', title: 'Abrir calendário', sub: 'Comando', run: push('/calendario') },
      { id: 'k-not', icon: 'notifications', title: 'Abrir notificações', sub: 'Comando', run: push('/notificacoes') },
    ];
    const q = norm(query.trim());
    return (q ? all.filter((h) => norm(h.title).includes(q) || norm(h.sub).includes(q)) : all).slice(0, 8);
  }, [query, tables, characters, router, onClose]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', paddingTop: 60, paddingHorizontal: 16 }}>
        <Pressable style={{ ...absoluteFill }} onPress={onClose} accessibilityLabel="Fechar busca" />
        <View accessibilityViewIsModal style={{ maxHeight: '80%', padding: 14, borderRadius: 16, gap: 10, backgroundColor: COLORS.surfaceContainerHigh }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(20) }}>Busca rápida</Text>
            <Pressable onPress={onClose} accessibilityLabel="Fechar"><MaterialIcons name="close" size={24} color={COLORS.onSurfaceVariant} /></Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, ...inputStyle() }}>
            <MaterialIcons name="search" size={20} color={COLORS.onSurfaceVariant} />
            <TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Buscar mesas, fichas, comandos…" placeholderTextColor={COLORS.onSurfaceVariant}
              accessibilityLabel="Buscar" returnKeyType="search" onSubmitEditing={() => hits[0]?.run()}
              style={{ flex: 1, color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(16) }} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 6 }}>
            {hits.length === 0 ? (
              <StateBlock icon="search-off" title="Nada encontrado" text="Tente outros termos." actionLabel="Limpar busca" onAction={() => setQuery('')} />
            ) : hits.map((h) => (
              <Pressable key={h.id} onPress={h.run} accessibilityRole="button" accessibilityLabel={`${h.title}. ${h.sub}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 10, borderRadius: 12, backgroundColor: COLORS.surfaceContainerLowest }}>
                <MaterialIcons name={h.icon} size={22} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(15) }}>{h.title}</Text>
                  <Text numberOfLines={1} style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{h.sub}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const absoluteFill = { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 } as const;
