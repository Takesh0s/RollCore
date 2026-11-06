import { useAppStore } from '@/store/useAppStore'
import { AppHeader } from '@/components/ui/AppHeader'
import { IconPlus } from '@/components/ui/icons'
import { useDesktop } from '@/hooks/useDesktop'
import type { Character } from '@/types'

/** Lista de fichas do usuário autenticado — RF0002.5. Layout do Figma: avatar, nome e "Editar". */
export function CharacterListScreen() {
  return useDesktop() ? <DesktopCharacterList /> : <MobileCharacterList />
}

/** Cartão de ficha do computador: avatar, nome, PV com barra, CA e ações. */
function CharCard({ char, onOpen, onEdit }: { char: Character; onOpen: () => void; onEdit: () => void }) {
  const pct = char.max_hp > 0 ? Math.max(0, Math.min(100, (char.hp / char.max_hp) * 100)) : 0
  return (
    <article className="sheet-card">
      <div className="sheet-card-head">
        {char.avatar_url
          ? <img className="sheet-card-avatar" src={char.avatar_url} alt="" />
          : <span className="sheet-card-avatar" aria-hidden="true">{char.name.charAt(0).toUpperCase()}</span>}
        <div className="sheet-card-id">
          <h3>{char.name}</h3>
          <p>{char.class} · {char.race} · Nível {char.level}</p>
        </div>
      </div>
      <div className="sheet-card-stats">
        <span>HP {char.hp}/{char.max_hp}</span>
        <span>CA {char.ac}</span>
      </div>
      <div className={`sheet-card-bar${pct < 60 ? ' low' : ''}`}><div style={{ width: `${pct}%` }} /></div>
      <div className="sheet-card-actions">
        <button className="btn sheet-btn open" onClick={onOpen}>Abrir</button>
        <button className="btn sheet-btn" onClick={onEdit} aria-label={`Editar ${char.name}`}>Editar</button>
      </div>
    </article>
  )
}

function DesktopCharacterList() {
  const { navigate, characters, selectCharacter } = useAppStore()
  const go = (id: number, screen: 'ficha' | 'editar-personagem') => { selectCharacter(id); navigate(screen) }

  return (
    <div className="device">
      <AppHeader title="Fichas" />
      <div className="page-body">
        <div className="sheet-toolbar">
          <div className="sheet-chips">
            <span className="on">Todas</span>
            <span className="soon" title="Em breve">Minhas</span>
            <span className="soon" title="Em breve">Compartilhadas</span>
            <span className="soon" title="Em breve">Rascunhos</span>
          </div>
          <div className="sheet-toolbar-actions">
            <button className="btn sheet-btn import" disabled title="Em breve">Importar</button>
            <button className="btn sheet-btn new" onClick={() => navigate('novo-personagem')}>
              <IconPlus /> Nova ficha
            </button>
          </div>
        </div>
        <p className="sheet-count">
          {characters.length} {characters.length === 1 ? 'personagem' : 'personagens'}
        </p>
        <div className="sheet-grid">
          {characters.map(c => (
            <CharCard key={c.id} char={c} onOpen={() => go(c.id, 'ficha')} onEdit={() => go(c.id, 'editar-personagem')} />
          ))}
          <button className="sheet-new-card" onClick={() => navigate('novo-personagem')}>
            <IconPlus />
            <span>Criar nova ficha</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function MobileCharacterList() {
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
