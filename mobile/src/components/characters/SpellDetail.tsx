import { View } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text } from '../accessible-text';
import { COLORS, appFontSize } from '../../design/shared';
import { LEVEL_LABELS, SCHOOL_COLORS, type Spell } from '../../types';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Text style={{ width: 118, color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{label}</Text>
      <Text style={{ flex: 1, color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(13) }}>{value}</Text>
    </View>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
      <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BOLD, fontSize: appFontSize(11) }}>{text}</Text>
    </View>
  );
}

/** Full spell card (compendium and the expanded row of a known spell), with an optional action button. */
export function SpellDetail({ spell, action }: {
  spell: Spell;
  action?: { label: string; onPress: () => void; loading?: boolean; danger?: boolean };
}) {
  const school = SCHOOL_COLORS[spell.school] ?? '#888';
  const level = LEVEL_LABELS[spell.level] ?? `${spell.level}°`;
  return (
    <View style={{ gap: 10, padding: 12, borderRadius: 10, backgroundColor: COLORS.surfaceContainerLowest, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(18), flexShrink: 1 }}>{spell.name}</Text>
        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: school }}>
          <Text style={{ color: '#fff', fontFamily: BOLD, fontSize: appFontSize(11) }}>{spell.school}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Tag text={spell.level === 0 ? 'Truque' : `${level} nível`} />
        {spell.ritual && <Tag text="Ritual" />}
        {spell.concentration && <Tag text="Concentração" />}
      </View>
      <View style={{ gap: 4 }}>
        <Row label="Tempo de conjuração" value={spell.castingTime} />
        <Row label="Alcance" value={spell.range} />
        <Row label="Componentes" value={spell.components} />
        <Row label="Duração" value={spell.duration} />
        {spell.damageDice ? (
          <Row label="Dano" value={`${spell.damageDice} ${spell.damageType ?? ''}${spell.attackType === 'ranged' ? ' (ataque à distância)' : spell.attackType === 'melee' ? ' (ataque corpo a corpo)' : ''}${spell.saveAttribute ? ` · TR ${spell.saveAttribute}` : ''}`} />
        ) : spell.saveAttribute ? <Row label="Resistência" value={`TR de ${spell.saveAttribute}`} /> : null}
      </View>
      <Text style={{ color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(14), lineHeight: appFontSize(14) * 1.45 }}>{spell.description}</Text>
      {spell.higherLevels ? (
        <Text style={{ color: COLORS.onSurface, fontFamily: BODY, fontSize: appFontSize(14) }}>
          <Text style={{ fontFamily: BOLD }}>Em níveis superiores. </Text>{spell.higherLevels}
        </Text>
      ) : null}
      {action && (
        <Pressable onPress={action.onPress} disabled={action.loading} accessibilityRole="button"
          style={{ minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', opacity: action.loading ? 0.6 : 1,
            backgroundColor: action.danger ? '#c0392b' : COLORS.primary }}>
          <Text style={{ color: action.danger ? '#fff' : COLORS.onPrimary, fontFamily: BOLD, fontSize: appFontSize(14) }}>{action.loading ? '…' : action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}
