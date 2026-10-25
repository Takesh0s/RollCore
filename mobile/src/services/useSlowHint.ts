import { useEffect, useState } from 'react';
import { SLOW_REQUEST_HINT_MS } from './config';

/** True once a request has been pending for a while (e.g. the free-tier server is waking up). */
export function useSlowHint(pending: boolean): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!pending) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), SLOW_REQUEST_HINT_MS);
    return () => clearTimeout(timer);
  }, [pending]);
  return slow;
}

export const SLOW_HINT_TEXT = 'Acordando o servidor… isso pode levar até 1 minuto na primeira vez.';
