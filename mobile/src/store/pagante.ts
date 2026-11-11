import { useEffect, useState } from 'react';

// TODO: vir do backend/conta (assinatura). Por enquanto é um flag local (true = recursos de assinante liberados).
let pagante = true;
const listeners = new Set<() => void>();

export function usePagante(): boolean {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((t) => t + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return pagante;
}

export function setPagante(valor: boolean) {
  pagante = valor;
  listeners.forEach((l) => l());
}
