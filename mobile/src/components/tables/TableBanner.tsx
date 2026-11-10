import { MaterialIcons } from '@expo/vector-icons';
import { ImageBackground, View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../accessible-text';
import { COLORS, appFontSize } from '../../design/shared';
import { imageSrc } from '../../lib/mapImage';
import type { TableSummary } from '../../store/useTables';

const BOLD = 'AtkinsonHyperlegible_700Bold';

/** Faixa de uma mesa, como na lista do web: capa, nome por cima e botão "Entrar". Sem capa, usa um fundo liso com ícone. */
export function TableBanner({ table, onEnter }: { table: TableSummary; onEnter: () => void }) {
  const cover = imageSrc(table.coverUrl);
  const body = (
    <View style={{ height: 150, padding: 12, justifyContent: 'space-between' }}>
      <Text numberOfLines={2} style={{ color: cover ? '#fff' : COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(20), textShadowColor: cover ? '#000' : 'transparent', textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } }}>{table.name}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Pressable onPress={onEnter} accessibilityRole="button" accessibilityLabel={`Entrar na mesa ${table.name}`}
          style={{ minHeight: 40, paddingHorizontal: 22, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
          <Text style={{ color: COLORS.onPrimary, fontFamily: BOLD, fontSize: appFontSize(14) }}>Entrar</Text>
        </Pressable>
      </View>
    </View>
  );
  return (
    <View style={{ borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.outlineVariant, backgroundColor: COLORS.surfaceContainerHigh }}>
      {cover ? (
        <ImageBackground source={{ uri: cover }} resizeMode="cover" accessibilityLabel={`Capa de ${table.name}`}>{body}</ImageBackground>
      ) : (
        <View>
          <MaterialIcons name="groups" size={64} color={COLORS.outlineVariant} style={{ position: 'absolute', right: 14, top: 12 }} />
          {body}
        </View>
      )}
    </View>
  );
}
