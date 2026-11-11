import { useAcessibilidade } from '../store/acessibilidade';
import { useRouter } from 'expo-router';
import { Text as NativeText, View } from 'react-native';
import { AccessibleText as Text } from '../components/accessible-text';
import { AuthButton, AuthLink, AuthShell } from '../components/AuthParts';
import { AUTH_COLORS, appFontSize } from '../design/shared';

const BODY = 'Inter_400Regular';

/**
 * Recuperar senha, como no web: o envio do link por e-mail ainda depende do backend (Fase 2),
 * então a tela explica isso em vez de simular um envio.
 */
export default function RecuperarSenhaScreen() {
  useAcessibilidade();
  const router = useRouter();
  return (
    <AuthShell subtitle="Recuperar senha">
      <View style={{ padding: 14, borderRadius: 12, marginBottom: 14, backgroundColor: AUTH_COLORS.field, gap: 12 }}>
        <Text style={{ color: AUTH_COLORS.typed, fontFamily: BODY, fontSize: appFontSize(15) }}>
          O envio do link de redefinição por e-mail chega na <NativeText style={{ fontFamily: 'Inter_700Bold' }}>Fase 2</NativeText>, junto ao serviço de e-mails do backend.
        </Text>
        <Text style={{ color: AUTH_COLORS.typed, fontFamily: BODY, fontSize: appFontSize(15) }}>Por enquanto, crie uma nova conta para acessar o sistema.</Text>
      </View>
      <AuthButton label="Criar conta" onPress={() => router.replace('/cadastro')} />
      <AuthLink label="Voltar para o login" onPress={() => router.replace('/login')} />
    </AuthShell>
  );
}
