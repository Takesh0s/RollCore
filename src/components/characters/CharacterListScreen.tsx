import { useAppStore } from '@/store/useAppStore'

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
      <div className="topbar">
        <button className="topbar-back" onClick={() => navigate('dashboard')}>←</button>
        <div className="topbar-info">
          <div className="top-title">Meus Personagens</div>
        </div>
      </div>

      <div className="page-body">
        <div className="list-header">
          <h2 className="section-title section-title-inline">Lista</h2>
          <button className="btn btn-gold" onClick={() => navigate('novo-personagem')}>
            + Novo Personagem
          </button>
        </div>

        {characters.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum personagem criado ainda.</p>
            <button
              className="btn btn-primary btn-auto"
              style={{ padding: '10px 28px' }}
              onClick={() => navigate('novo-personagem')}
            >
              + Criar primeiro personagem
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            {characters.map(char => (
              <div key={char.id} className="char-card">
                <div className="char-card-info">
                  <div className="char-card-name">{char.name}</div>
                  <div className="char-card-meta">
                    {char.class} · {char.race} · Nível {char.level}
                  </div>
                </div>
                <div className="char-card-actions">
                  <button className="btn btn-ghost" onClick={() => openEdit(char.id)}>
                    Editar
                  </button>
                  <button className="btn btn-ghost" onClick={() => openSheet(char.id)}>
                    Ver ficha →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
