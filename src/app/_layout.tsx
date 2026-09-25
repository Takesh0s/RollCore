import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

SplashScreen.preventAutoHideAsync();

// Sem barra de abas aqui: as telas de autenticação (Cadastro, Login,
// Recuperação de Senha) navegam em pilha simples, cada uma com seu próprio
// Header. Quando chegarmos nas telas pós-login (Minhas Mesas, Ficha, etc),
// criamos um layout aninhado próprio com a barra Dashboard/Dice/Skills/Vault
// só para essas rotas, sem afetar as telas de auth.
export default function RootLayout() {
  const colorScheme = useColorScheme();
  SplashScreen.hideAsync();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
