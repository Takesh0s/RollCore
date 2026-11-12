import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Fragment, useEffect } from 'react';
import { AppState, View, useColorScheme, useWindowDimensions } from 'react-native';
import { COLORS, applyAccessibilityPalette, resolvedThemeMode, useAppFonts } from '../design/shared';
import { onSessionExpired } from '../services/api';
import { QuickRollModal } from '../components/dice/QuickRollModal';
import { QuickSearchModal } from '../components/QuickSearchModal';
import { ToastHost } from '../components/ToastHost';
import { useAcessibilidade } from '../store/acessibilidade';
import { useContaAtiva } from '../store/conta';
import { useNotifications } from '../store/useNotifications';
import { falar, pararLeitura } from '../utils/acessibilidadeAudio';
import { textoNarracaoDaTela } from '../utils/screenNarration';

SplashScreen.preventAutoHideAsync();

function ScreenNarrator() {
  const pathname = usePathname();
  const { narracao, descreverVisuais } = useAcessibilidade();
  useEffect(() => {
    pararLeitura();
    if (!narracao) return;
    const timer = setTimeout(() => {
      const text = textoNarracaoDaTela(pathname, descreverVisuais);
      if (text) falar(text, true);
    }, 650);
    return () => clearTimeout(timer);
  }, [pathname, narracao, descreverVisuais]);
  return null;
}

// Mantém o selo de notificações atualizado: ao entrar, a cada minuto e quando o app volta ao primeiro plano.
function NotificationsPoller() {
  const logged = !!useContaAtiva();
  useEffect(() => {
    if (!logged) return;
    const load = () => { void useNotifications.getState().load(); };
    load();
    const id = setInterval(load, 60_000);
    const sub = AppState.addEventListener('change', (state) => { if (state === 'active') load(); });
    return () => { clearInterval(id); sub.remove(); };
  }, [logged]);
  return null;
}

// Moldura do web no celular (Figma 412 x 917): filete prateado a 18 px dos lados e 40 px do topo, e embaixo a faixa de dentes
// (5 dentes escuros, um em cada ponta e três entre os vãos, com 4 vãos azuis iguais; tudo escala com a largura) colada na borda da tela, atrás da barra de navegação.
// Os outros temas não têm dentes: o filete fecha a 9 px da borda.
const FRAME_TOP = 40;
const FRAME_SIDE = 18;
const NOTCH = 41;
function Frame({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const { tema } = useAcessibilidade();
  const teeth = tema === 'medieval';
  const band = (teeth ? NOTCH : 0) + 9;
  const tile = width * 0.2257;
  const gap = tile * 0.441;
  const count = Math.ceil(width / tile);
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ flex: 1, paddingTop: FRAME_TOP, paddingBottom: band, paddingHorizontal: FRAME_SIDE }}>{children}</View>
      <View pointerEvents="none" style={{ position: 'absolute', top: FRAME_TOP, left: FRAME_SIDE, right: FRAME_SIDE, bottom: band, borderWidth: 1, borderColor: 'rgba(192,192,192,0.75)' }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: band, backgroundColor: COLORS.background, overflow: 'hidden' }}>
        {teeth && Array.from({ length: count }).map((_, i) => (
          <View key={i} style={{ position: 'absolute', bottom: 0, height: NOTCH, left: i * tile + gap, width: tile - gap, backgroundColor: COLORS.canvas }} />
        ))}
      </View>
    </View>
  );
}

// When the refresh token is rejected the session is over: send the user to login.
function SessionWatcher() {
  const router = useRouter();
  useEffect(() => onSessionExpired(() => router.replace('/login')), [router]);
  return null;
}

// Sem barra de abas aqui: as telas de autenticação (Cadastro, Login,
// Recuperação de Senha) navegam em pilha simples, cada uma com seu próprio
// Header. Quando chegarmos nas telas pós-login (Minhas Mesas, Ficha, etc),
// criamos um layout aninhado próprio com a barra Dashboard/Dice/Skills/Vault
// só para essas rotas, sem afetar as telas de auth.
export default function RootLayout() {
  const systemScheme = useColorScheme(); // re-renderiza quando o aparelho troca entre claro e escuro
  const { daltonico, tipoDaltonismo, tema, modoTema } = useAcessibilidade();
  // Aplicada durante o render, antes das telas filhas lerem as cores (também reage à troca claro/escuro do sistema).
  applyAccessibilityPalette(daltonico, tipoDaltonismo);
  // O React Compiler guarda o resultado das telas que não dependem de estado e trata COLORS como constante;
  // trocar a chave refaz a árvore inteira quando a paleta muda (ação rara: tema, modo, daltonismo ou claro/escuro do sistema).
  const paletteKey = `${daltonico ? tipoDaltonismo : 'normal'}|${tema}|${modoTema}|${systemScheme}`;
  // As fontes do Figma (Inter, Source Serif 4, Fugaz One, Kumar One Outline) carregam uma vez, aqui, antes de qualquer tela.
  const fontsLoaded = useAppFonts();
  if (!fontsLoaded) return null;
  void SplashScreen.hideAsync();
  return (
    <ThemeProvider value={resolvedThemeMode() === 'dark' ? DarkTheme : DefaultTheme}>
      <Fragment key={paletteKey}>
        <Frame><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} /></Frame>
        <ScreenNarrator />
        <SessionWatcher />
        <NotificationsPoller />
        <QuickRollModal />
        <QuickSearchModal />
        <ToastHost />
      </Fragment>
    </ThemeProvider>
  );
}
