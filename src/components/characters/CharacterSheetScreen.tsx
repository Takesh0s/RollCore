import { useState } from 'react'
import { useAppStore, useSelectedCharacter } from '@/store/useAppStore'
import { calcMod, formatMod, profBonus, ATTR_KEYS, ATTR_LABELS, SKILLS, getSkillBonus } from '@/lib/engine'

/** Read-only view of a character sheet — UC-02 / RF0002.5 */
export function CharacterSheetScreen() {
  const { navigate, updateCharacter, showToast } = useAppStore()
  const char = useSelectedCharacter()

  // hp = current HP (Doc. de Visão §9.2); initialised from stored value
  const [currentHp, setCurrentHp] = useState<number>(() => char?.hp ?? 0)
  const [hpDelta,   setHpDelta]   = useState('')

  if (!char) {
    navigate('personagens')
    return null
  }

  const maxHp = char.max_hp ?? char.hp
  const hpPct = Math.max(0, Math.min(100, (currentHp / maxHp) * 100))

  // Bar colour shifts green → yellow → red as HP drops — visual combat aid
  const hpColor =
    hpPct > 60 ? 'var(--success)' :
    hpPct > 30 ? '#e8a020'        :
                 'var(--fail)'

  /** Apply damage: reduce currentHp by delta, floor at 0, persist. */
  function applyDamage() {
    const n = parseInt(hpDelta, 10)
    if (isNaN(n) || n <= 0) return
    const next = Math.max(0, currentHp - n)
    setCurrentHp(next)
    setHpDelta('')
    updateCharacter(char.id, { ...char, hp: next })
    showToast(`${n} de dano aplicado`)
  }

  /** Apply healing: increase currentHp by delta, cap at max_hp, persist. */
  function applyHeal() {
    const n = parseInt(hpDelta, 10)
    if (isNaN(n) || n <= 0) return
    const next = Math.min(maxHp, currentHp + n)
    setCurrentHp(next)
    setHpDelta('')
    updateCharacter(char.id, { ...char, hp: next })
    showToast(`${n} HP recuperado`, 'success')
  }

  /** Restore HP to maximum — UC-02 §9.2 max_hp field. */
  function resetHp() {
    setCurrentHp(maxHp)
    updateCharacter(char.id, { ...char, hp: maxHp })
    showToast('HP restaurado ao máximo', 'success')
  }

  return (
    <div className="device">
      <div className="topbar">
        <button className="topbar-back" onClick={() => navigate('personagens')}>←</button>
        <div className="topbar-info">
          <div className="top-title">{char.name}</div>
          <div className="top-sub">{char.class} · {char.race} · Nível {char.level}</div>
        </div>
        {/* Edit shortcut from the sheet view — RF0002.4 */}
        <button className="topbar-action" onClick={() => navigate('editar-personagem')}>
          Editar
        </button>
      </div>

      <div className="page-body">

        {/* ── HP Tracker — UC-02 §9.2 hp (current) / max_hp ── */}
        <h2 className="section-title">Pontos de Vida</h2>
        <div className="hp-tracker">
          <div className="hp-numbers">
            <span className="hp-current" style={{ color: hpColor }}>{currentHp}</span>
            <span className="hp-sep">/</span>
            <span className="hp-max">{maxHp}</span>
          </div>
          <div className="hp-bar-wrap">
            <div
              className="hp-bar-fill"
              style={{ width: `${hpPct}%`, background: hpColor }}
            />
          </div>
          <div className="hp-controls">
            <input
              className="form-input hp-input"
              type="number"
              min={1}
              placeholder="Valor"
              value={hpDelta}
              onChange={e => setHpDelta(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applyDamage() }}
            />
            <button className="btn btn-danger btn-hp" onClick={applyDamage} title="Aplicar dano">
              − Dano
            </button>
            <button className="btn btn-heal btn-hp" onClick={applyHeal} title="Curar">
              + Cura
            </button>
            <button className="btn btn-ghost btn-hp" onClick={resetHp} title="Restaurar HP máximo">
              ↺
            </button>
          </div>
        </div>

        {/* ── Atributos ── */}
        <h2 className="section-title" style={{ marginTop: 22 }}>Atributos</h2>
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

        {/* ── Combate ── */}
        <h2 className="section-title">Combate</h2>
        <div className="attr-grid">
          <div className="attr-box">
            <span className="attr-box-label">Proficiência</span>
            {/* Derived from level — UC-02 RN-03 */}
            <strong className="attr-box-value">+{profBonus(char.level)}</strong>
            <span className="attr-box-mod">bônus</span>
          </div>
          <div className="attr-box">
            {/* max_hp stored separately from hp — Doc. de Visão §9.2 */}
            <span className="attr-box-label">HP Máx.</span>
            <strong className="attr-box-value">{maxHp}</strong>
            <span className="attr-box-mod">pontos</span>
          </div>
          <div className="attr-box">
            <span className="attr-box-label">CA</span>
            <strong className="attr-box-value">{char.ac}</strong>
            <span className="attr-box-mod">armadura</span>
          </div>
        </div>

        {/* ── Perícias — todas as 18 do SRD D&D 5e ── */}
        {/* UC-02 §7.1; Doc. de Visão §4.1 Compêndio integrado de regras */}
        <h2 className="section-title">Perícias</h2>
        <div className="skills-grid">
          {SKILLS.map(skill => {
            const bonus     = getSkillBonus(skill.name, char.attributes, char.level)
            const formatted = formatMod(bonus)
            return (
              <div key={skill.name} className="skill-row">
                <span className="skill-attr">{ATTR_LABELS[skill.attr]}</span>
                <span className="skill-name">{skill.name}</span>
                <span className={`skill-bonus ${bonus >= 0 ? 'positive' : 'negative'}`}>
                  {formatted}
                </span>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
