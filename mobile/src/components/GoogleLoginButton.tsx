import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { View } from 'react-native';
import { AUTH_COLORS, appFontSize } from '../design/shared';
import { GOOGLE_ANDROID_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../services/googleAuth';
import { AccessiblePressable as Pressable, AccessibleText as Text } from './accessible-text';

// Lets the browser popup/tab used by the web flow hand its result back to the app.
WebBrowser.maybeCompleteAuthSession();

interface Props {
  disabled?: boolean;
  onIdToken: (idToken: string) => void;
  onError: (message: string) => void;
  style?: object;
  badgeStyle?: object;
  badgeTextStyle?: object;
}

/**
 * "Login com o google" button. Only render it when
 * {@link googleConfiguradoNestaPlataforma} is true: the Google auth hook throws
 * when the client id for the running platform is missing.
 */
export default function GoogleLoginButton({ disabled, onIdToken, onError, style, badgeStyle, badgeTextStyle }: Props) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    selectAccount: true,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token ?? response.authentication?.idToken;
      if (idToken) onIdToken(idToken);
      else onError('O Google não devolveu a identificação. Tente novamente.');
    } else if (response.type === 'error') {
      onError('Não foi possível entrar com o Google. Tente novamente.');
    }
    // dismiss / cancel: the user backed out, nothing to report
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return (
    <Pressable
      onPress={() => { void promptAsync(); }}
      disabled={disabled || !request}
      accessibilityRole="button"
      accessibilityLabel="Entrar com o Google"
      style={[style, { opacity: disabled || !request ? 0.6 : 1 }]}>
      <View style={badgeStyle}>
        <Text style={badgeTextStyle}>G</Text>
      </View>
      <Text style={{ color: AUTH_COLORS.white, fontSize: appFontSize(14) }}>Login com o google</Text>
    </Pressable>
  );
}
