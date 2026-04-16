import { useState } from 'react'
import { useAppStore, useSelectedCharacter } from '@/store/useAppStore'
import {
  calcMod, formatMod, profBonus,
  ATTR_KEYS, ATTR_LABELS, SKILLS, getSkillBonus,
  CLASS_CASTER_TYPE, getMaxSpellSlots,
  getSpellSaveDC, getSpellAttackBonus,
  getRaceTraits,
} from '@/lib/engine'
import type { SpellSlots, WarlockSlots } from '@/types'

type SheetTab = 'combat' | 'skills' | 'spells' | 'traits'

export function CharacterSheetScreen() {
  const { navigate, updateCharacter, showToast } = useAppStore()
  const char = useSelectedCharacter()

  const [tab,       setTab]       = useState<SheetTab>('combat')
  const [currentHp, setCurrentHp] = useState<number>(() => char?.hp     ?? 0)
  const [tempHp,    setTempHp]    = useState<number>(() => char?.temp_hp ?? 0)
  const [hpDelta,   setHpDelta]   = useState('')
  const [trackerFlash, setTrackerFlash] = useState<'damage'|'heal'|''>('')
  const [slots,     setSlots]     = useState<SpellSlots | null>(() => char?.spell_slots    ?? null)
  const [wSlots,    setWSlots]    = useState<WarlockSlots | null>(() => char?.warlock_slots ?? null)

  if (!char) { navigate('personagens'); return null }

  const character = char
  const maxHp      = char.max_hp ?? char.hp
  const hpPct      = Math.max(0, Math.min(100, (currentHp / maxHp) * 100))
  const hpColor    = hpPct > 60 ? 'var(--success)' : hpPct > 30 ? '#e8a020' : 'var(--fail)'
  const casterType = CLASS_CASTER_TYPE[char.class] ?? 'none'
  const maxSlots   = getMaxSpellSlots(char.class, char.level)
  const spellDC    = getSpellSaveDC(char.class, char.level, char.attributes)
  const spellAtk   = getSpellAttackBonus(char.class, char.level, char.attributes)
  const raceTraits = getRaceTraits(char.race)

  function persist(hpOv?: number, tempOv?: number, slotsOv?: SpellSlots | null, wOv?: WarlockSlots | null) {
    updateCharacter(character.id, {
      ...character,
      hp:            hpOv    ?? currentHp,
      temp_hp:       tempOv  ?? tempHp,
      spell_slots:   (slotsOv !== undefined ? slotsOv : slots) ?? undefined,
      warlock_slots: (wOv     !== undefined ? wOv     : wSlots) ?? undefined,
    })
  }

  function applyDamage() {
    const n = parseInt(hpDelta, 10)
    if (isNaN(n) || n <= 0) return
    let rem = n, newTemp = tempHp, newHp = currentHp
    if (newTemp > 0) { const abs = Math.min(newTemp, rem); newTemp -= abs; rem -= abs }
    newHp = Math.max(0, newHp - rem)
    setCurrentHp(newHp); setTempHp(newTemp); setHpDelta('')
    persist(newHp, newTemp)
    setTrackerFlash('damage'); setTimeout(() => setTrackerFlash(''), 500)
    showToast(`${n} de dano aplicado${tempHp > 0 && newTemp < tempHp ? ' (HP temporário absorveu parte)' : ''}`)
  }

  function applyHeal() {
    const n = parseInt(hpDelta, 10)
    if (isNaN(n) || n <= 0) return
    const newHp = Math.min(maxHp, currentHp + n)
    setCurrentHp(newHp); setHpDelta(''); persist(newHp)
    setTrackerFlash('heal'); setTimeout(() => setTrackerFlash(''), 500)
    showToast(`${n} HP recuperado`, 'success')
  }

  function addTempHp() {
    const n = parseInt(hpDelta, 10)
    if (isNaN(n) || n <= 0) return
    const newTemp = Math.max(tempHp, n) // temp HP doesn't stack — take higher (PHB p.198)
    setTempHp(newTemp); setHpDelta(''); persist(undefined, newTemp)
    showToast(`HP temporário: ${newTemp}`, 'success')
  }

  function resetHp() {
    setCurrentHp(maxHp); setTempHp(0); persist(maxHp, 0)
    showToast('HP restaurado ao máximo', 'success')
  }

  function spendSlot(level: number) {
    if (!slots) return
    const k = level as keyof SpellSlots
    if (slots[k] <= 0) return
    const next = { ...slots, [k]: slots[k] - 1 }
    setSlots(next); persist(undefined, undefined, next)
    showToast(`Espaço de ${level}° nível gasto`)
  }

  function restoreSlot(level: number) {
    if (!slots || !maxSlots) return
    const k = level as keyof SpellSlots
    if (slots[k] >= maxSlots[k]) return
    const next = { ...slots, [k]: slots[k] + 1 }
    setSlots(next); persist(undefined, undefined, next)
  }

  function restoreAllSlots() {
    if (!maxSlots) return
    setSlots({ ...maxSlots }); persist(undefined, undefined, { ...maxSlots })
    showToast('Espaços de magia recuperados (descanso longo)', 'success')
  }

  function spendWarlockSlot() {
    if (!wSlots || wSlots.used >= wSlots.total) return
    const next = { ...wSlots, used: wSlots.used + 1 }
    setWSlots(next); persist(undefined, undefined, undefined, next)
    showToast(`Espaço de pacto (${wSlots.level}°) gasto`)
  }

  function restoreWarlockSlots() {
    if (!wSlots) return
    const next = { ...wSlots, used: 0 }
    setWSlots(next); persist(undefined, undefined, undefined, next)
    showToast('Espaços de pacto recuperados', 'success')
  }

  const SPELL_LABELS = ['1°','2°','3°','4°','5°','6°','7°','8°','9°']

  return (
    <div className="device">
      <div className="topbar">
        <button className="topbar-back" onClick={() => navigate('personagens')}>←</button>
        <div className="topbar-info">
          <div className="top-title">{character.name}</div>
          <div className="top-sub">
            {character.class}{char.subclass ? ` · ${char.subclass}` : ''} · {char.race} · Nível {char.level}
          </div>
        </div>
        <button className="topbar-action" onClick={() => navigate('editar-personagem')}>Editar</button>
      </div>

      {/* ── HP Tracker ── */}
      <div className="page-body" style={{ paddingBottom: 8 }}>
        <h2 className="section-title">Pontos de Vida</h2>
        <div className={`hp-tracker${trackerFlash ? ' flash-' + trackerFlash : ''}`}>
          <div className="hp-numbers">
            <span className={`hp-current${hpPct <= 25 ? ' critical' : ''}`} style={{ color: hpColor }}>{currentHp}</span>
            <span className="hp-sep">/</span>
            <span className="hp-max">{maxHp}</span>
            {tempHp > 0 && <span className="hp-temp">+{tempHp} temp</span>}
          </div>
          <div className="hp-bar-wrap">
            <div className="hp-bar-fill" style={{ width: `${hpPct}%`, background: hpColor }} />
            {tempHp > 0 && (
              <div className="hp-bar-temp" style={{ width: `${Math.min(100, (tempHp / maxHp) * 100)}%` }} />
            )}
          </div>
          <div className="hp-controls">
            <input className="form-input hp-input" type="number" min={1} placeholder="Valor"
              value={hpDelta} onChange={e => setHpDelta(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applyDamage() }} />
            <button className="btn btn-danger btn-hp" onClick={applyDamage}>− Dano</button>
            <button className="btn btn-heal   btn-hp" onClick={applyHeal}>+ Cura</button>
            <button className="btn btn-temp   btn-hp" onClick={addTempHp} title="Adicionar HP temporário">⚡ Temp</button>
            <button className="btn btn-ghost  btn-hp" onClick={resetHp} title="Restaurar HP máximo">↺</button>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="sheet-tabs">
        {(['combat','skills'] as SheetTab[]).map(t => (
          <button key={t} className={`sheet-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t === 'combat' ? 'Combate' : 'Perícias'}
          </button>
        ))}
        {casterType !== 'none' && (
          <button className={`sheet-tab${tab === 'spells' ? ' active' : ''}`} onClick={() => setTab('spells')}>
            Magias
          </button>
        )}
        {raceTraits.length > 0 && (
          <button className={`sheet-tab${tab === 'traits' ? ' active' : ''}`} onClick={() => setTab('traits')}>
            Traços
          </button>
        )}
      </div>

      <div className="page-body tab-content" key={tab}>

        {/* COMBAT TAB */}
        {tab === 'combat' && (
          <>
            <h2 className="section-title">Atributos</h2>
            <div className="attr-grid">
              {ATTR_KEYS.map(key => {
                const val = char.attributes[key], mod = calcMod(val)
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
                <strong className="attr-box-value">+{profBonus(char.level)}</strong>
                <span className="attr-box-mod">bônus</span>
              </div>
              <div className="attr-box">
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
          </>
        )}

        {/* SKILLS TAB */}
        {tab === 'skills' && (
          <>
            <h2 className="section-title">Perícias</h2>
            <div className="skills-grid">
              {SKILLS.map(skill => {
                const bonus = getSkillBonus(skill.name, char.attributes, char.level)
                return (
                  <div key={skill.name} className="skill-row">
                    <span className="skill-attr">{ATTR_LABELS[skill.attr]}</span>
                    <span className="skill-name">{skill.name}</span>
                    <span className={`skill-bonus ${bonus >= 0 ? 'positive' : 'negative'}`}>
                      {formatMod(bonus)}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* SPELLS TAB */}
        {tab === 'spells' && (
          <>
            {/* Spell stats header */}
            {spellDC !== null && (
              <div className="spell-stats-row">
                <div className="spell-stat-box">
                  <span className="spell-stat-label">CD das Magias</span>
                  <strong className="spell-stat-value">{spellDC}</strong>
                </div>
                <div className="spell-stat-box">
                  <span className="spell-stat-label">Ataque Mágico</span>
                  <strong className="spell-stat-value">{formatMod(spellAtk!)}</strong>
                </div>
              </div>
            )}

            {(casterType === 'full' || casterType === 'half') && slots && maxSlots && (
              <>
                <div className="spell-section-header">
                  <h2 className="section-title" style={{ margin: 0 }}>Espaços de Magia</h2>
                  <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={restoreAllSlots}>
                    ↺ Descanso Longo
                  </button>
                </div>
                <div className="spell-slots-grid">
                  {SPELL_LABELS.map((label, i) => {
                    const lvl = (i + 1) as keyof SpellSlots
                    const max = maxSlots[lvl], curr = slots[lvl]
                    if (max === 0) return null
                    return (
                      <div key={lvl} className="spell-slot-row">
                        <span className="spell-slot-label">{label} nível</span>
                        <div className="spell-slot-pips">
                          {Array.from({ length: max }).map((_, j) => (
                            <button key={j}
                              className={`spell-pip${j < curr ? ' available' : ' spent'}`}
                              onClick={() => j < curr ? spendSlot(lvl) : restoreSlot(lvl)}
                              title={j < curr ? 'Gastar espaço' : 'Recuperar espaço'} />
                          ))}
                        </div>
                        <span className="spell-slot-count">{curr}/{max}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {casterType === 'warlock' && wSlots && (
              <>
                <div className="spell-section-header">
                  <h2 className="section-title" style={{ margin: 0 }}>Magia de Pacto</h2>
                  <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={restoreWarlockSlots}>
                    ↺ Descanso Curto
                  </button>
                </div>
                <div className="warlock-slots-box">
                  <p className="warlock-level-label">
                    Nível do espaço: <strong>{wSlots.level}°</strong>
                    <span className="warlock-note"> — recupera em descanso curto ou longo</span>
                  </p>
                  <div className="spell-slot-pips" style={{ justifyContent: 'flex-start', marginTop: 10 }}>
                    {Array.from({ length: wSlots.total }).map((_, j) => (
                      <button key={j}
                        className={`spell-pip warlock-pip${j >= wSlots.used ? ' available' : ' spent'}`}
                        onClick={j >= wSlots.used ? spendWarlockSlot : restoreWarlockSlots}
                        title={j >= wSlots.used ? 'Gastar espaço de pacto' : 'Recuperar todos'} />
                    ))}
                  </div>
                  <p className="warlock-slots-count">
                    {wSlots.total - wSlots.used} / {wSlots.total} espaços disponíveis
                  </p>
                </div>
                <p className="spell-note">
                  O Warlock usa Magia de Pacto — poucos espaços, todos do mesmo nível,
                  recuperados a cada descanso curto ou longo (PHB p.107).
                </p>
              </>
            )}
          </>
        )}

        {/* TRAITS TAB */}
        {tab === 'traits' && (
          <>
            <h2 className="section-title">Traços Raciais — {char.race}</h2>
            <div className="traits-list">
              {raceTraits.map(trait => (
                <div key={trait.name} className={`trait-card trait-${trait.type}`}>
                  <div className="trait-header">
                    <span className="trait-name">{trait.name}</span>
                    <span className="trait-type-badge">
                      {trait.type === 'stat_bonus' ? 'Bônus' : trait.type === 'choice' ? 'Escolha' : 'Passivo'}
                    </span>
                  </div>
                  <p className="trait-desc">{trait.description}</p>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}