import { useAppStore } from '@/store/useAppStore'
import { AppHeader } from '@/components/ui/AppHeader'
import { IconPlus } from '@/components/ui/icons'

/** Lista de fichas do usuário autenticado — RF0002.5. Layout do Figma: avatar, nome e "Editar". */
export function CharacterListScreen() {
  const { navigate, characters, selectCharacter } = useAppStore()

  function openSheet(id: number) {
    selectCharacter(id)
    navigate('ficha')
  }

  function openEdit(id: number) {
    selectCharacter(id)
    navigate('editar-personagem')
  }

  return (
    <div className="device">
      <AppHeader title="Fichas" />

      <div className="page-body">
        <div className="list-toolbar">
          <button className="home-icon-btn" aria-label="Nova ficha" onClick={() => navigate('novo-personagem')}>
            <IconPlus />
          </button>
        </div>

        {characters.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center' }}>
            <p>Nenhuma ficha criada ainda.</p>
            <button className="btn btn-primary" onClick={() => navigate('novo-personagem')}>
              Criar ficha
            </button>
          </div>
        ) : (
          characters.map(char => (
            <div key={char.id} className="char-row">
              <button className="char-row-main" onClick={() => openSheet(char.id)}>
                {char.avatar_url
                  ? <img className="char-row-avatar" src={char.avatar_url} alt="" />
                  : <span className="char-row-avatar" aria-hidden="true">{char.name.charAt(0).toUpperCase()}</span>}
                <span className="char-row-info">
                  <span className="char-row-name" style={{ display: 'block' }}>{char.name}</span>
                  <span className="char-row-meta" style={{ display: 'block' }}>{char.class} · {char.race} · Nível {char.level}</span>
                </span>
              </button>
              <button
                className="btn btn-primary btn-pill"
                onClick={() => openEdit(char.id)}
                aria-label={`Editar ${char.name}`}
              >
                Editar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
