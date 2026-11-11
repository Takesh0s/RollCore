import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { restaurarSessao } from '../store/conta';

export default function Index() {
  const [destino, setDestino] = useState<'/inicio' | '/login' | null>(null);
  useEffect(() => {
    let ativo = true;
    restaurarSessao()
      .then((restaurada) => { if (ativo) setDestino(restaurada ? '/inicio' : '/login'); })
      .catch(() => { if (ativo) setDestino('/login'); });
    return () => { ativo = false; };
  }, []);
  return destino ? <Redirect href={destino} /> : null;
}
