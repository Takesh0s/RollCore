import { View, type ViewProps } from 'react-native';

/**
 * Contêiner das telas. A moldura do app (`Frame`, em app/_layout) já reserva a barra de status, a barra de navegação e a faixa de dentes,
 * então as telas não somam inset nenhum. Aceita `edges` só para manter a assinatura do SafeAreaView.
 */
export function SafeArea({ edges: _edges, ...rest }: ViewProps & { edges?: readonly string[] }) {
  return <View {...rest} />;
}
