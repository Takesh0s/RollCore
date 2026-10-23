import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { applyAccessibilityPalette } from '../design/shared';
import { useAcessibilidade } from '../store/acessibilidade';
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

// Sem barra de abas aqui: as telas de autenticação (Cadastro, Login,
// Recuperação de Senha) navegam em pilha simples, cada uma com seu próprio
// Header. Quando chegarmos nas telas pós-login (Minhas Mesas, Ficha, etc),
// criamos um layout aninhado próprio com a barra Dashboard/Dice/Skills/Vault
// só para essas rotas, sem afetar as telas de auth.
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { daltonico, tipoDaltonismo } = useAcessibilidade();
  useEffect(() => applyAccessibilityPalette(daltonico, tipoDaltonismo), [daltonico, tipoDaltonismo]);
  SplashScreen.hideAsync();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
      <ScreenNarrator />
    </ThemeProvider>
  );
}
