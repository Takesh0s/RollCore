export type ScreenNarrationKind = 'text' | 'visual';
type Entry = { text: string; kind: ScreenNarrationKind };
const screens = new Map<string, Map<string, Entry>>();

export function registrarTextoDaTela(path: string, id: string, text: string, kind: ScreenNarrationKind = 'text'): () => void {
  const value = text.replace(/\s+/g, ' ').trim();
  if (!path || !value) return () => undefined;
  let entries = screens.get(path);
  if (!entries) {
    entries = new Map<string, Entry>();
    screens.set(path, entries);
  }
  entries.set(id, { text: value, kind });
  return () => {
    const current = screens.get(path);
    current?.delete(id);
    if (current?.size === 0) screens.delete(path);
  };
}

export function textoNarracaoDaTela(path: string, includeVisuals: boolean): string {
  const entries = [...(screens.get(path)?.values() ?? [])];
  const visibleText = entries.filter((entry) => entry.kind === 'text').map((entry) => entry.text);
  const visualDescriptions = includeVisuals
    ? entries.filter((entry) => entry.kind === 'visual').map((entry) => `Elemento interativo: ${entry.text}`)
    : [];
  const unique = [...new Set([...visibleText, ...visualDescriptions].map((text) => text.trim()).filter(Boolean))];
  return unique.join('. ');
}
