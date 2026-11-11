import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Fragment, useEffect } from 'react';
import { AppState, useColorScheme } from 'react-native';
import { applyAccessibilityPalette, resolvedThemeMode } from '../design/shared';
import { onSessionExpired } from '../services/api';
import { QuickRollModal } from '../components/dice/QuickRollModal';
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
  SplashScreen.hideAsync();
  return (
    <ThemeProvider value={resolvedThemeMode() === 'dark' ? DarkTheme : DefaultTheme}>
      <Fragment key={paletteKey}>
        <Stack screenOptions={{ headerShown: false }} />
        <ScreenNarrator />
        <SessionWatcher />
        <NotificationsPoller />
        <QuickRollModal />
        <ToastHost />
      </Fragment>
    </ThemeProvider>
  );
}
