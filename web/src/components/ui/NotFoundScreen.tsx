import { useAppStore } from '@/store/useAppStore'
import { AppHeader } from './AppHeader'
import { StateView } from './StateView'

/** Página não encontrada (Figma 18.5): mesa removida, link vencido ou evento que não existe mais. */
export function NotFoundScreen() {
  const navigate = useAppStore(s => s.navigate)
  return (
    <div className="device">
      <AppHeader title="Não encontrada" />
      <div className="page-body">
        <StateView kind="notfound" title="Página não encontrada"
                   text="O link pode ter expirado ou a mesa foi removida."
                   actions={[
                     { label: 'Voltar ao início', primary: true, onClick: () => navigate('dashboard') },
                     { label: 'Ver minhas mesas', onClick: () => navigate('mesas') },
                   ]} />
      </div>
    </div>
  )
}
