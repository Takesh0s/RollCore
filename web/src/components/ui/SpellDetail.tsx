import type { Spell } from '@/types'
import { SCHOOL_COLORS, LEVEL_LABELS } from '@/types'

interface Props {
  spell:   Spell
  /** If provided, renders an action button (e.g. "Adicionar" or "Remover") */
  action?: { label: string; onClick: () => void; loading?: boolean; danger?: boolean }
}

/**
 * Full spell detail card — used in SpellSearchModal and as an expanded row
 * in the CharacterSheetScreen spell list.
 */
export function SpellDetail({ spell, action }: Props) {
  const schoolColor = SCHOOL_COLORS[spell.school] ?? '#888'
  const levelLabel  = LEVEL_LABELS[spell.level] ?? `${spell.level}°`

  return (
    <div className="spell-detail-card">
      <div className="spell-detail-header">
        <div className="spell-detail-name-row">
          <span className="spell-detail-name">{spell.name}</span>
          <span className="spell-school-badge" style={{ background: schoolColor }}>
            {spell.school}
          </span>
        </div>
        <div className="spell-detail-meta">
          <span className="spell-level-tag">{spell.level === 0 ? 'Truque' : `${levelLabel} nível`}</span>
          {spell.ritual        && <span className="spell-tag spell-tag-ritual">Ritual</span>}
          {spell.concentration && <span className="spell-tag spell-tag-conc">Concentração</span>}
        </div>
      </div>

      <div className="spell-detail-grid">
        <div className="spell-detail-row">
          <span className="sdl">Tempo de Conjuração</span>
          <span className="sdv">{spell.castingTime}</span>
        </div>
        <div className="spell-detail-row">
          <span className="sdl">Alcance</span>
          <span className="sdv">{spell.range}</span>
        </div>
        <div className="spell-detail-row">
          <span className="sdl">Componentes</span>
          <span className="sdv">{spell.components}</span>
        </div>
        <div className="spell-detail-row">
          <span className="sdl">Duração</span>
          <span className="sdv">{spell.duration}</span>
        </div>
        {spell.damageDice && (
          <div className="spell-detail-row">
            <span className="sdl">Dano</span>
            <span className="sdv spell-damage">
              {spell.damageDice} {spell.damageType}
              {spell.attackType === 'ranged' && ' (ataque à distância)'}
              {spell.attackType === 'melee'  && ' (ataque corpo a corpo)'}
              {spell.saveAttribute && ` · TR ${spell.saveAttribute}`}
            </span>
          </div>
        )}
        {!spell.damageDice && spell.saveAttribute && (
          <div className="spell-detail-row">
            <span className="sdl">Resistência</span>
            <span className="sdv">TR de {spell.saveAttribute}</span>
          </div>
        )}
      </div>

      <p className="spell-desc">{spell.description}</p>

      {spell.higherLevels && (
        <p className="spell-higher">
          <strong>Em Níveis Superiores.</strong> {spell.higherLevels}
        </p>
      )}

      {action && (
        <button
          className={`btn ${action.danger ? 'btn-danger' : 'btn-primary'} spell-action-btn`}
          onClick={action.onClick}
          disabled={action.loading}
        >
          {action.loading ? '…' : action.label}
        </button>
      )}
    </div>
  )
}