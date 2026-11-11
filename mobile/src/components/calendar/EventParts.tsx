import { View } from 'react-native';
import { AccessibleText as Text } from '../accessible-text';
import { COLORS, appFontSize } from '../../design/shared';
import { RSVP_LABELS, type Rsvp } from '../../lib/calendar';

const BOLD = 'AtkinsonHyperlegible_700Bold';
const BADGE: Record<Rsvp, string> = { yes: '#6fbf9b', maybe: '#d6a93a', no: '#e57373', pending: '#9aa0a6' };

export function RsvpBadge({ status }: { status: Rsvp }) {
  return (
    <View accessible accessibilityLabel={RSVP_LABELS[status]} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: BADGE[status] }}>
      <Text style={{ color: BADGE[status], fontFamily: BOLD, fontSize: appFontSize(10) }}>{RSVP_LABELS[status].toUpperCase()}</Text>
    </View>
  );
}

/** Barra de progresso dos confirmados. */
export function ConfirmedBar({ confirmed, total }: { confirmed: number; total: number }) {
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: confirmed }}
      style={{ height: 8, borderRadius: 4, backgroundColor: COLORS.surfaceContainerHighest, overflow: 'hidden' }}>
      <View style={{ height: 8, width: total ? `${(confirmed / total) * 100}%` : 0, backgroundColor: '#6fbf9b' }} />
    </View>
  );
}
