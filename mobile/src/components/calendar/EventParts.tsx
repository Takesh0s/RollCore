import { View } from 'react-native';
import { AccessibleText as Text } from '../accessible-text';
import { COLORS, appFontSize } from '../../design/shared';
import { RSVP_LABELS, type Rsvp } from '../../lib/calendar';

const BODY = 'Inter_400Regular';
const BOLD = 'Inter_700Bold';
export const SERIF = 'SourceSerif4_700Bold';

/** `.cal-badge`: cores cheias do web, texto escuro. */
const BADGE: Record<Rsvp, string> = { yes: '#6DB89A', pending: '#E8BD4F', maybe: '#9DB7D8', no: '#D77878' };

export function RsvpBadge({ status }: { status: Rsvp }) {
  return (
    <View accessible accessibilityLabel={RSVP_LABELS[status]} style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: BADGE[status] }}>
      <Text style={{ color: '#10201A', fontFamily: BOLD, fontSize: appFontSize(10.5) }}>{RSVP_LABELS[status].toUpperCase()}</Text>
    </View>
  );
}

/** `.cal-progress`: barra dos confirmados. */
export function ConfirmedBar({ confirmed, total }: { confirmed: number; total: number }) {
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: confirmed }}
      style={{ height: 7, borderRadius: 99, backgroundColor: COLORS.surfaceContainerHigh, overflow: 'hidden' }}>
      <View style={{ height: 7, borderRadius: 99, width: total ? `${(confirmed / total) * 100}%` : 0, backgroundColor: '#6DB89A' }} />
    </View>
  );
}

/** `.cal-note`: aviso em cartão. */
export function Note({ children }: { children: string }) {
  return (
    <View style={{ padding: 10, borderRadius: 8, backgroundColor: COLORS.surfaceContainerHigh }}>
      <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>{children}</Text>
    </View>
  );
}
