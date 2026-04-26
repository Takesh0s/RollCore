import { useState, useEffect, useCallback } from 'react'
import type { Spell } from '@/types'
import { LEVEL_LABELS, SCHOOL_COLORS } from '@/types'
import { fetchSpells, addSpellToCharacter } from '@/lib/spells'
import { SpellDetail } from '@/components/ui/SpellDetail'
import { useAppStore } from '@/store/useAppStore'

interface Props {
  characterId:   number | string
  characterClass: string
  knownSpellIds: Set<string>
  onAdded:       (spell: Spell) => void
  onClose:       () => void
}

const LEVELS = [null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

/**
 * Full-screen modal for browsing the D&D 5e SRD spell compendium
 * and adding spells to a character.
 *
 * Filters: class (pre-filled), level, free-text search.
 * Tapping a spell row expands the full detail card with an "Adicionar" button.
 */
export function SpellSearchModal({ characterId, characterClass, knownSpellIds, onAdded, onClose }: Props) {
  const { showToast } = useAppStore()

  const [spells,       setSpells]       = useState<Spell[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [levelFilter,  setLevelFilter]  = useState<number | null>(null)
  const [expandedId,   setExpandedId]   = useState<string | null>(null)
  const [addingId,     setAddingId]     = useState<string | null>(null)

  // Debounced search fetch
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      fetchSpells({ className: characterClass, level: levelFilter, search })
        .then(setSpells)
        .catch(() => setSpells([]))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [characterClass, levelFilter, search])

  const handleAdd = useCallback(async (spell: Spell) => {
    if (knownSpellIds.has(spell.id)) {
      showToast('Personagem já conhece essa magia.', 'error')
      return
    }
    setAddingId(spell.id)
    try {
      await addSpellToCharacter(characterId, spell.id)
      onAdded(spell)
      showToast(`${spell.name} adicionada!`, 'success')
      setExpandedId(null)
    } catch (err: any) {
      const msg = err.response?.data?.detail ?? 'Erro ao adicionar magia.'
      showToast(msg, 'error')
    } finally {
      setAddingId(null)
    }
  }, [characterId, knownSpellIds, onAdded, showToast])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet spell-search-modal" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="spell-modal-header">
          <div>
            <h2 className="modal-title">Compêndio de Magias</h2>
            <p className="modal-sub">{characterClass} · {spells.length} magias encontradas</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* ── Filters ── */}
        <div className="spell-modal-filters">
          <input
            className="form-input spell-search-input"
            type="search"
            placeholder="Buscar magia…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <div className="spell-level-filter-row">
            {LEVELS.map(lv => (
              <button
                key={lv ?? 'all'}
                className={`spell-level-chip${levelFilter === lv ? ' active' : ''}`}
                onClick={() => setLevelFilter(lv === levelFilter ? null : lv)}
              >
                {lv === null ? 'Todos' : lv === 0 ? 'Truque' : `${LEVEL_LABELS[lv]}°`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Spell list ── */}
        <div className="spell-modal-list">
          {loading && <div className="spell-modal-loading">Carregando…</div>}

          {!loading && spells.length === 0 && (
            <div className="spell-modal-empty">
              Nenhuma magia encontrada para esses filtros.
            </div>
          )}

          {!loading && spells.map(spell => {
            const known    = knownSpellIds.has(spell.id)
            const expanded = expandedId === spell.id

            return (
              <div key={spell.id} className={`spell-list-row${known ? ' known' : ''}${expanded ? ' expanded' : ''}`}>
                {/* ── Summary row (always visible) ── */}
                <div
                  className="spell-row-summary"
                  onClick={() => setExpandedId(expanded ? null : spell.id)}
                >
                  <div className="spell-row-left">
                    <span
                      className="spell-level-dot"
                      style={{ background: spell.level === 0 ? '#888' : SCHOOL_COLORS[spell.school] ?? '#888' }}
                    >
                      {spell.level === 0 ? '✦' : spell.level}
                    </span>
                    <div className="spell-row-info">
                      <span className="spell-row-name">{spell.name}</span>
                      <span className="spell-row-meta">
                        {spell.school}
                        {spell.concentration && ' · ◎ Conc'}
                        {spell.ritual && ' · ® Ritual'}
                        {spell.damageDice && ` · ${spell.damageDice} ${spell.damageType ?? ''}`}
                      </span>
                    </div>
                  </div>
                  <div className="spell-row-right">
                    {known
                      ? <span className="spell-known-badge">✓ Conhece</span>
                      : <span className="spell-row-chevron">{expanded ? '▲' : '▼'}</span>
                    }
                  </div>
                </div>

                {/* ── Expanded detail ── */}
                {expanded && !known && (
                  <div className="spell-row-detail">
                    <SpellDetail
                      spell={spell}
                      action={{
                        label:   'Adicionar ao personagem',
                        loading: addingId === spell.id,
                        onClick: () => handleAdd(spell),
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}