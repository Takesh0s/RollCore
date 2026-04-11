import { useAppStore, useSelectedCharacter } from '@/store/useAppStore'
import { calcMod, formatMod, profBonus, ATTR_KEYS, ATTR_LABELS } from '@/lib/engine'

export function CharacterSheetScreen() {
  const { navigate } = useAppStore()
  const char = useSelectedCharacter()

  if (!char) {
    navigate('personagens')
    return null
  }

  return (
    <div className="device">
      <div className="topbar">
        <button className="topbar-back" onClick={() => navigate('personagens')}>←</button>
        <div className="topbar-info">
          <div className="top-title">{char.name}</div>
          <div className="top-sub">{char.class} · {char.race} · Nível {char.level}</div>
        </div>
        {/* RF0002.4: botão de edição direto da ficha */}
        <button
          className="topbar-action"
          onClick={() => navigate('editar-personagem')}
        >
          Editar
        </button>
      </div>

      <div className="page-body">
        <h2 className="section-title">Atributos</h2>
        <div className="attr-grid">
          {ATTR_KEYS.map(key => {
            const val = char.attributes[key]
            const mod = calcMod(val)
            return (
              <div key={key} className="attr-box">
                <span className="attr-box-label">{ATTR_LABELS[key]}</span>
                <strong className="attr-box-value">{val}</strong>
                <span className="attr-box-mod">{formatMod(mod)}</span>
              </div>
            )
          })}
        </div>

        <h2 className="section-title">Combate</h2>
        <div className="attr-grid">
          <div className="attr-box">
            <span className="attr-box-label">Proficiência</span>
            {/* UC-02 RN-03 */}
            <strong className="attr-box-value">+{profBonus(char.level)}</strong>
            <span className="attr-box-mod">bônus</span>
          </div>
          <div className="attr-box">
            {/* Sprint 3: max_hp separado de hp — Seção 9.2 */}
            <span className="attr-box-label">HP Máx.</span>
            <strong className="attr-box-value">{char.max_hp ?? char.hp}</strong>
            <span className="attr-box-mod">pontos</span>
          </div>
          <div className="attr-box">
            <span className="attr-box-label">CA</span>
            <strong className="attr-box-value">{char.ac}</strong>
            <span className="attr-box-mod">armadura</span>
          </div>
        </div>
      </div>
    </div>
  )
}
