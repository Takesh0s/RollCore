import { ImageBackground, View } from 'react-native';
import { AccessibleText as Text } from '../accessible-text';
import { appFontSize } from '../../design/shared';
import { imageSrc } from '../../lib/mapImage';
import type { TableSummary } from '../../store/useTables';
import { Gradient, PillBtn, SERIF } from './parts';

/**
 * `.table-banner` do web: capa (ou degradê), sombra no topo e na base, nome no canto superior esquerdo e "Entrar" centralizado embaixo.
 */
export function TableBanner({ table, onEnter }: { table: TableSummary; onEnter: () => void }) {
  const cover = imageSrc(table.coverUrl);
  const content = (
    <View style={{ minHeight: 118, paddingTop: 8, paddingHorizontal: 10, paddingBottom: 10, justifyContent: 'space-between', alignItems: 'center' }}>
      <Gradient vertical colors={['#000000|0.55', '#000000|0', '#000000|0.25']} stops={[0, 0.55, 1]} />
      <Text numberOfLines={2} style={{ alignSelf: 'flex-start', color: '#fff', fontFamily: SERIF, fontSize: appFontSize(15), textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } }}>{table.name}</Text>
      <PillBtn kind="primary" label="Entrar" accessibilityLabel={`Entrar na mesa ${table.name}`} onPress={onEnter} />
    </View>
  );
  return (
    <View style={{ marginBottom: 14, overflow: 'hidden', backgroundColor: '#2a3237' }}>
      {cover ? (
        <ImageBackground source={{ uri: cover }} resizeMode="cover" accessibilityLabel={`Capa de ${table.name}`}>{content}</ImageBackground>
      ) : (
        <View>
          <Gradient colors={['#3d5a73', '#2a3a46', '#3b6b59']} stops={[0, 0.55, 1]} />
          {content}
        </View>
      )}
    </View>
  );
}
