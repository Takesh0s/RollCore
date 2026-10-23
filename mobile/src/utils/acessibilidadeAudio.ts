import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { getAcessibilidade } from '../store/acessibilidade';

const RATE: Record<'Lenta' | 'Normal' | 'Rápida', number> = { Lenta: 0.78, Normal: 1, Rápida: 1.22 };
let speechToken = 0;
const rolePt: Record<string, string> = {
  button: 'Botão', link: 'Link', checkbox: 'Caixa de seleção', radio: 'Opção',
  switch: 'Interruptor', tab: 'Aba', search: 'Busca', menuitem: 'Item do menu',
};
export function nomeDoPapel(tipo?: string): string {
  return tipo ? rolePt[tipo] ?? tipo : '';
}

export function pararLeitura(): void {
  speechToken += 1;
  void Speech.stop().catch(() => undefined);
}

export function falar(texto: string, force = false): void {
  const mensagem = texto.replace(/\s+/g, ' ').trim();
  if (!mensagem) return;
  const config = getAcessibilidade();
  if (!force && !config.narracao) return;
  const token = ++speechToken;
  void Speech.stop().then(() => {
    if (token !== speechToken) return;
    const options = {
      language: 'pt-BR',
      rate: RATE[config.velocidadeNarracao],
      pitch: 1,
      volume: 1,
      onError: (error: Error) => console.warn('Falha na síntese de voz', error),
    };
    const maxLength = Math.max(500, Math.min(Speech.maxSpeechInputLength || 3000, 3000));
    let remaining = mensagem;
    while (remaining.length > maxLength) {
      let splitAt = remaining.lastIndexOf(' ', maxLength);
      if (splitAt < maxLength * 0.6) splitAt = maxLength;
      Speech.speak(remaining.slice(0, splitAt).trim(), options);
      remaining = remaining.slice(splitAt).trim();
    }
    if (remaining) Speech.speak(remaining, options);
  }).catch((error) => console.warn('Falha ao iniciar a síntese de voz', error));
}

export function velocidadeEmPalavras(): string {
  return getAcessibilidade().velocidadeNarracao.toLocaleLowerCase('pt-BR');
}

export function feedbackDeAcao(rotulo?: string, tipo?: string, descreverVisual = false): void {
  const config = getAcessibilidade();
  const papel = nomeDoPapel(tipo);
  const mensagem = [papel && papel !== 'none' ? `${papel}.` : '', rotulo].filter(Boolean).join(' ').trim();
  if ((config.narracao || config.feedbackSonoro) && mensagem) falar(mensagem, true);
  if (config.feedbackSonoro) {
    void Haptics.selectionAsync().catch(() => undefined);
  }
  // Mantido explícito para que leitores e botões de ícone enviem rótulo visual em modo de descrição.
  if (descreverVisual && config.descreverVisuais && !mensagem) falar('Elemento visual interativo.', true);
}

export function textoTesteNarração(): string {
  const config = getAcessibilidade();
  return `Teste de narração em português do Brasil. Velocidade ${velocidadeEmPalavras()}. A síntese de voz está funcionando.`;
}
