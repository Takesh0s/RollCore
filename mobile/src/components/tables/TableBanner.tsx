import { MaterialIcons } from '@expo/vector-icons';
import { ImageBackground, View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../accessible-text';
import { COLORS, appFontSize } from '../../design/shared';
import { imageSrc } from '../../lib/mapImage';
import type { TableSummary } from '../../store/useTables';

const BOLD = 'Inter_700Bold';

/** Faixa de uma mesa, como na lista do web: capa, nome por cima e botão "Entrar". Sem capa, usa um fundo liso com ícone. */
export function TableBanner({ table, onEnter }: { table: TableSummary; onEnter: () => void }) {
  const cover = imageSrc(table.coverUrl);
  const body = (
    <View style={{ height: 150, padding: 12, justifyContent: 'space-between' }}>
      <Text numberOfLines={2} style={{ color: cover ? '#fff' : COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(17), textShadowColor: cover ? '#000' : 'transparent', textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } }}>{table.name}</Text>
      <View style={{ alignItems: 'center' }}>
        <Pressable onPress={onEnter} accessibilityRole="button" accessibilityLabel={`Entrar na mesa ${table.name}`}
          style={{ minHeight: 38, paddingHorizontal: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.btn, shadowColor: '#fff', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }}>
          <Text style={{ color: COLORS.btnText, fontFamily: 'Inter_400Regular', fontSize: appFontSize(14) }}>Entrar</Text>
        </Pressable>
      </View>
    </View>
  );
  return (
    <View style={{ borderRadius: 4, overflow: 'hidden', backgroundColor: COLORS.tile }}>
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
