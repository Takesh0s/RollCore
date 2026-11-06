import { useState, useEffect, useCallback } from 'react'
import { useAppStore, useSelectedCharacter } from '@/store/useAppStore'
import { Modal } from '@/components/ui/Modal'
import { AvatarUpload } from '@/components/ui/AvatarUpload'
import {
  calcMod, formatMod, profBonus,
  ATTR_KEYS, ATTR_LABELS, getRaceBonuses,
} from '@/lib/engine'
import { calcMaxHp, calcUnarmoredAC, ATTR_INPUT_MAX, ATTR_INPUT_MIN } from '@/lib/engine-hp'
import { SYSTEMS, getSystem, DEFAULT_SYSTEM, allSubclassOptions } from '@/lib/systems'
import { downloadCharacter } from '@/lib/characterIO'
import type { AttrKey, Attributes } from '@/types'
import { AppHeader } from '@/components/ui/AppHeader'

type Mode = 'new' | 'edit'
interface Props { mode: Mode }

interface AttrFieldProps {
  attrKey: AttrKey; value: string
  onChange: (key: AttrKey, val: string) => void
  error?: string; bonus?: number
}

function AttrField({ attrKey, value, onChange, error, bonus }: AttrFieldProps) {
  const num = parseInt(value, 10)
  // Modifier shown uses the base value the player typed — racial bonus is shown separately
  const mod = !isNaN(num) && num >= ATTR_INPUT_MIN && num <= ATTR_INPUT_MAX
    ? formatMod(calcMod(num))
    : '—'
  return (
    <div className="attr-form-item">
      <span className="attr-form-label">{ATTR_LABELS[attrKey]}</span>
      <input
        className={`form-input input-center${error ? ' error' : value && !error ? ' valid' : ''}`}
        type="number"
        min={ATTR_INPUT_MIN}
        max={ATTR_INPUT_MAX}   // PHB p.14 — attribute cap is 20
        placeholder="1–20"
        value={value}
        onChange={e => onChange(attrKey, e.target.value)}
      />
      <div className="attr-form-mod">{mod}</div>
      {bonus !== undefined && bonus !== 0 && (
        <div className="attr-form-race-bonus">+{bonus} racial</div>
      )}
      {error && <small className="error-msg">{error}</small>}
    </div>
  )
}

interface PickProps {
  id: string; custom: boolean; value: string; options: string[]
  onChange: (v: string) => void; className: string
  disabled?: boolean; title?: string; placeholder?: string
}

/** Closed list (select) for a real system; list with suggestions + free text for "Personalizado". */
function Pick({ id, custom, value, options, onChange, className, disabled, title, placeholder = 'Selecione...' }: PickProps) {
  if (custom) {
    return (
      <>
        <input className={className} list={`dl-${id}`} value={value} maxLength={50}
               placeholder="Escolha ou digite" disabled={disabled} title={title}
               onChange={e => onChange(e.target.value)} />
        <datalist id={`dl-${id}`}>{options.map(o => <option key={o} value={o} />)}</datalist>
      </>
    )
  }
  return (
    <select className={className} value={value} disabled={disabled} title={title} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export function CharacterFormScreen({ mode }: Props) {
  const { navigate, addCharacter, updateCharacter, deleteCharacter, showToast } = useAppStore()
  const existing = useSelectedCharacter()
  const isEdit   = mode === 'edit'

  const [system,   setSystem]   = useState(DEFAULT_SYSTEM)
  const [name,     setName]     = useState('')
  const [level,    setLevel]    = useState('')
  const [cls,      setCls]      = useState('')
  const [subclass, setSubclass] = useState('')
  const [race,     setRace]     = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)

  const [attrs, setAttrs] = useState<Record<AttrKey, string>>(
    { STR: '', DEX: '', CON: '', INT: '', WIS: '', CHA: '' }
  )
  const [maxHp, setMaxHp] = useState('')
  const [ac,    setAc]    = useState('')

  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [showDelete, setShowDelete] = useState(false)
  const [loading,    setLoading]    = useState(false)

  // Pre-fill on edit
  useEffect(() => {
    if (isEdit && existing) {
      setSystem(existing.game_system ?? DEFAULT_SYSTEM)
      setName(existing.name)
      setLevel(String(existing.level))
      setCls(existing.class)
      setSubclass(existing.subclass ?? '')
      setRace(existing.race)
      setMaxHp(String(existing.max_hp ?? existing.hp))
      setAc(String(existing.ac))
      setAvatarUrl(existing.avatar_url)
      const filled: Record<AttrKey, string> = { STR:'', DEX:'', CON:'', INT:'', WIS:'', CHA:'' }
      // The sheet stores final values (base + racial bonus), but the form edits the BASE value and
      // adds the bonus again on save. Subtract it here so editing never counts the bonus twice.
      const isCustomSheet = !!getSystem(existing.game_system ?? DEFAULT_SYSTEM).custom
      const storedBonus   = isCustomSheet ? {} : getRaceBonuses(existing.race)
      ATTR_KEYS.forEach(k => {
        filled[k] = String(Math.max(ATTR_INPUT_MIN, existing.attributes[k] - (storedBonus[k] ?? 0)))
      })
      setAttrs(filled)
    }
  }, [isEdit, existing])

  const sys          = getSystem(system)
  const isCustom     = !!sys.custom
  // "Personalizado" does not add racial bonuses automatically: the player builds the sheet by hand
  const raceBonuses  = isCustom ? {} : getRaceBonuses(race)
  const subclassInfo = sys.subclasses[cls]
  const lvlNum       = parseInt(level, 10)
  // The subclass can always be picked; the level only decides the hint (the table's rule is up to the group)
  const showSubclass = isCustom || !!subclassInfo
  const belowChoiceLevel = !!subclassInfo && !isCustom && (isNaN(lvlNum) || lvlNum < subclassInfo.choiceLevel)
  const subclassOptions = isCustom
    ? Array.from(new Set([...(subclassInfo?.options ?? []), ...allSubclassOptions()]))
    : (subclassInfo?.options ?? [])

  /** Switching to a stricter system drops values it does not know. */
  function changeSystem(next: string) {
    const target = getSystem(next)
    setSystem(next)
    if (!target.custom) {
      if (cls && !target.classes.includes(cls))   { setCls('');   setSubclass('') }
      if (race && !target.races.includes(race))   setRace('')
    }
  }

  function stepLevel(delta: number) {
    const cur = parseInt(level, 10)
    const next = Math.min(20, Math.max(1, (isNaN(cur) ? 0 : cur) + delta))
    setLevel(String(next)); setErrors(p => ({ ...p, level: '' }))
  }

  // ── Auto-calculate HP and CA ────────────────────────────────────────────────

  /**
   * Fills maxHp and ac using PHB fixed-average formulas.
   * Called when the user clicks "Calcular automaticamente".
   * PHB p.15 for HP, PHB p.145 + p.47 + p.103 for CA.
   */
  function autoCalcHpAc() {
    const lvl  = parseInt(level, 10)
    const con  = parseInt(attrs.CON, 10)

    if (!cls || isNaN(lvl) || lvl < 1 || lvl > 20) {
      showToast('Preencha Classe e Nível antes de calcular.', 'error')
      return
    }

    // HP — requires CON
    if (!isNaN(con) && con >= 1) {
      const hp = calcMaxHp(cls, lvl, con)
      if (hp === null) {
        showToast('Essa classe não tem fórmula automática — preencha HP e CA manualmente.', 'error')
        return
      }
      setMaxHp(String(hp))
    }

    // CA — requires DEX (and CON for Bárbaro, WIS for Monge)
    const dex = parseInt(attrs.DEX, 10)
    const conVal = parseInt(attrs.CON, 10)
    const wisVal = parseInt(attrs.WIS, 10)

    if (!isNaN(dex)) {
      const attrSnapshot: Attributes = {
        STR: parseInt(attrs.STR, 10) || 10,
        DEX: dex,
        CON: !isNaN(conVal) ? conVal : 10,
        INT: parseInt(attrs.INT, 10) || 10,
        WIS: !isNaN(wisVal) ? wisVal : 10,
        CHA: parseInt(attrs.CHA, 10) || 10,
      }
      setAc(String(calcUnarmoredAC(cls, attrSnapshot)))
    }

    showToast('HP e CA calculados automaticamente (sem armadura)', 'success')
  }

  // ── Attr change handler ─────────────────────────────────────────────────────

  const handleAttrChange = useCallback((key: AttrKey, val: string) => {
    setAttrs(prev => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }, [errors])

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: Record<string, string> = {}

    if (!name.trim())           errs.name  = 'Nome é obrigatório.'
    if (!cls)                   errs.cls   = 'Classe é obrigatória.'
    if (!race)                  errs.race  = 'Raça é obrigatória.'

    const lvl = parseInt(level, 10)
    if (isNaN(lvl) || lvl < 1 || lvl > 20)
      errs.level = 'Nível deve ser entre 1 e 20.'   // UC-02 E01 / MSG004

    ATTR_KEYS.forEach(k => {
      const v = parseInt(attrs[k], 10)
      if (isNaN(v) || v < ATTR_INPUT_MIN || v > ATTR_INPUT_MAX)
        errs[k] = `Valor deve ser entre ${ATTR_INPUT_MIN} e ${ATTR_INPUT_MAX}.`  // UC-02 E03
    })

    const hp = parseInt(maxHp, 10)
    if (isNaN(hp) || hp < 1) errs.maxHp = 'HP Máximo deve ser ao menos 1.'

    const acVal = parseInt(ac, 10)
    if (isNaN(acVal) || acVal < 1) errs.ac = 'CA deve ser ao menos 1.'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!validate()) return
    setLoading(true)

    const lvl     = parseInt(level, 10)
    const bonuses = isCustom ? {} : getRaceBonuses(race)

    // Build post-bonus attributes (player types base, system adds racial)
    const finalAttrs: Attributes = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 }
    ATTR_KEYS.forEach(k => {
      finalAttrs[k] = parseInt(attrs[k], 10) + (bonuses[k] ?? 0)
    })

    const charData = {
      game_system: system,
      name:     name.trim(),
      class:    cls,
      subclass: showSubclass ? subclass.trim() : '',
      race,
      level:    lvl,
      attributes: finalAttrs,
      hp:       parseInt(maxHp, 10),
      max_hp:   parseInt(maxHp, 10),
      temp_hp:  0,
      ac:       parseInt(ac, 10),
      avatar_url: avatarUrl,
    }

    try {
      if (isEdit && existing) {
        await updateCharacter(existing.id, charData)
        showToast('Personagem atualizado!', 'success')
        navigate('ficha')
      } else {
        await addCharacter(charData)
        showToast('Personagem salvo com sucesso!', 'success')  // MSG005 — UC-02 §3.1
        navigate('personagens')
      }
    } catch {
      showToast('Erro ao salvar personagem.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!existing) return
    setLoading(true)
    try {
      await deleteCharacter(existing.id)
      showToast('Personagem excluído.', 'success')
      navigate('personagens')
    } catch {
      showToast('Erro ao excluir personagem.', 'error')
    } finally {
      setLoading(false)
      setShowDelete(false)
    }
  }

  return (
    <div className="device">
      <AppHeader title={isEdit ? (existing?.name || 'Ficha') : 'Criar Ficha'} onBack={() => navigate(isEdit ? 'ficha' : 'personagens')} />

      <div className="page-body">
       <div className="char-form-layout">
        <div className="char-form-main">

        {/* ── Character portrait (mobile; no desktop o retrato fica no cartão lateral) ── */}
        <div className="char-form-avatar-wrap">
          <AvatarUpload
            value={avatarUrl}
            initials={name.charAt(0) || '?'}
            onChange={setAvatarUrl}
            size={64}
          />
          <small className="field-hint" style={{ marginTop: 6 }}>
            Foto do personagem (opcional)
          </small>
        </div>

        {/* ── Identity ── */}
        <h2 className="section-title">Identidade</h2>

        <div className="form-group">
          <label className="form-label">Sistema</label>
          <select className="form-input valid" value={system} onChange={e => changeSystem(e.target.value)}>
            {SYSTEMS.map(sy => (
              <option key={sy.id} value={sy.id} disabled={!sy.available}>
                {sy.id}{sy.available ? '' : ' (em breve)'}
              </option>
            ))}
          </select>
          {isCustom && (
            <small className="field-hint">
              Personalizado oferece as classes, raças e subclasses de todos os sistemas e aceita nomes digitados por você.
              Bônus raciais não são aplicados automaticamente.
            </small>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Nome do Personagem</label>
          <input
            className={`form-input${errors.name ? ' error' : name.trim() ? ' valid' : ''}`}
            type="text" maxLength={100} placeholder="Ex: Aragorn"
            value={name}
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
          />
          {errors.name && <small className="error-msg">{errors.name}</small>}
        </div>

        <div className="form-row form-row-3">
          <div className="form-group form-col">
            <label className="form-label">Raça</label>
            <Pick id="race" custom={isCustom} value={race} options={sys.races}
                  className={`form-input${errors.race ? ' error' : race ? ' valid' : ''}`}
                  onChange={v => { setRace(v); setErrors(p => ({ ...p, race: '' })) }} />
            {errors.race && <small className="error-msg">{errors.race}</small>}
          </div>
          <div className="form-group form-col">
            <label className="form-label">Classe</label>
            <Pick id="class" custom={isCustom} value={cls} options={sys.classes}
                  className={`form-input${errors.cls ? ' error' : cls ? ' valid' : ''}`}
                  onChange={v => { setCls(v); if (!isCustom) setSubclass(''); setErrors(p => ({ ...p, cls: '' })) }} />
            {errors.cls && <small className="error-msg">{errors.cls}</small>}
          </div>
          <div className="form-group form-col">
            <label className="form-label">Subclasse</label>
            <Pick id="subclass" custom={isCustom} value={subclass} options={subclassOptions}
                  className={`form-input${subclass ? ' valid' : ''}`}
                  disabled={!showSubclass}
                  title={belowChoiceLevel ? `Normalmente escolhida a partir do nível ${subclassInfo!.choiceLevel}` : undefined}
                  placeholder={showSubclass ? 'Selecione (opcional)' : '—'}
                  onChange={setSubclass} />
          </div>
        </div>

        {/* Racial bonuses notice */}
        {race && Object.keys(raceBonuses).length > 0 && (
          <div className="race-bonus-notice">
            <strong>{race}:</strong>{' '}
            {Object.entries(raceBonuses).map(([k, v]) => `${ATTR_LABELS[k as AttrKey]} +${v}`).join(', ')}
            {' — aplicados automaticamente ao salvar.'}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Nível</label>
          <div className="level-stepper">
            <button type="button" aria-label="Diminuir nível" onClick={() => stepLevel(-1)}>−</button>
            <input
              className={`form-input input-center${errors.level ? ' error' : level && !errors.level ? ' valid' : ''}`}
              type="number" min={1} max={20} placeholder="1–20"
              value={level}
              onChange={e => { setLevel(e.target.value); setErrors(p => ({ ...p, level: '' })) }}
            />
            <button type="button" aria-label="Aumentar nível" onClick={() => stepLevel(1)}>+</button>
          </div>
          <small className="field-hint">
            Bônus de proficiência: {!isNaN(parseInt(level, 10)) ? `+${profBonus(parseInt(level, 10))}` : '—'}
          </small>
          {errors.level && <small className="error-msg">{errors.level}</small>}
        </div>

        {/* ── Attributes ── */}
        <h2 className="section-title" style={{ marginTop: 24 }}>Atributos</h2>
        <small className="field-hint" style={{ marginBottom: 12, display: 'block' }}>
          {isCustom ? 'Digite o valor final de cada atributo (1–20).' : 'Digite o valor base (1–20). Bônus raciais são aplicados automaticamente ao salvar.'}
        </small>
        <div className="attr-form-grid">
          {ATTR_KEYS.map(k => (
            <AttrField
              key={k}
              attrKey={k}
              value={attrs[k]}
              onChange={handleAttrChange}
              error={errors[k]}
              bonus={raceBonuses[k]}
            />
          ))}
        </div>

        {/* ── Combat stats ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Combate</h2>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={autoCalcHpAc}
            title="Calcula HP e CA automaticamente usando as fórmulas do PHB (média por nível, sem armadura)"
          >
            ⚡ Calcular automaticamente
          </button>
        </div>
        <small className="field-hint" style={{ marginBottom: 12, display: 'block' }}>
          HP usa a média por nível (PHB p.15). CA assume sem armadura — ajuste manualmente se necessário.
        </small>

        <div className="form-row">
          <div className="form-group form-col">
            <label className="form-label">HP Máximo</label>
            <input
              className={`form-input input-center${errors.maxHp ? ' error' : maxHp ? ' valid' : ''}`}
              type="number" min={1} placeholder="Ex: 12"
              value={maxHp}
              onChange={e => { setMaxHp(e.target.value); setErrors(p => ({ ...p, maxHp: '' })) }}
            />
            {errors.maxHp && <small className="error-msg">{errors.maxHp}</small>}
          </div>
          <div className="form-group form-col">
            <label className="form-label">Classe de Armadura</label>
            <input
              className={`form-input input-center${errors.ac ? ' error' : ac ? ' valid' : ''}`}
              type="number" min={1} placeholder="Ex: 14"
              value={ac}
              onChange={e => { setAc(e.target.value); setErrors(p => ({ ...p, ac: '' })) }}
            />
            {errors.ac && <small className="error-msg">{errors.ac}</small>}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="form-actions">
          {isEdit && (
            <button
              className="btn btn-danger btn-auto form-delete-mobile"
              style={{ marginTop: 0 }}
              onClick={() => setShowDelete(true)}
              disabled={loading}
            >
              Excluir
            </button>
          )}
          <button
            className="btn btn-outline btn-auto"
            onClick={() => navigate(isEdit ? 'ficha' : 'personagens')}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="btn btn-primary btn-auto"
            style={{ marginTop: 0 }}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? '…' : isEdit ? 'Salvar Alterações' : 'Criar Personagem'}
          </button>
        </div>

        </div>{/* /char-form-main */}

        {/* ── Cartão de pré-visualização (desktop) ── */}
        <aside className="char-form-side">
          <div className="side-card char-preview">
            <AvatarUpload value={avatarUrl} initials={name.charAt(0) || '?'} onChange={setAvatarUrl} size={96} />
            <h3>{name.trim() || 'Nome do personagem'}</h3>
            <span className="char-preview-system">{system}</span>
            <p className="char-preview-meta">
              {cls || 'Classe'} · {race || 'Raça'} · Nível {level || 1}
            </p>
            <div className="char-preview-stats">
              <span>HP {maxHp ? `${isEdit && existing ? existing.hp : maxHp} / ${maxHp}` : '— / —'}</span>
              <span>CA {ac || '—'}</span>
            </div>
            <div className="char-preview-bar"><div style={{ width: maxHp ? `${isEdit && existing ? Math.min(100, (existing.hp / Math.max(1, parseInt(maxHp, 10) || 1)) * 100) : 100}%` : '0%' }} /></div>
            <div className="char-preview-grid">
              <div><strong>{level || 1}</strong><small>Nível</small></div>
              <div><strong>{!isNaN(lvlNum) && lvlNum >= 1 && lvlNum <= 20 ? `+${profBonus(lvlNum)}` : '—'}</strong><small>Proficiência</small></div>
              <div><strong>{race || '—'}</strong><small>Raça</small></div>
            </div>
          </div>
          {isEdit ? (
            <>
              <button className="btn side-btn" onClick={() => navigate('ficha')} disabled={loading}>Abrir ficha</button>
              {existing && <button className="btn side-btn" onClick={() => downloadCharacter(existing)}>Exportar ficha</button>}
              <button className="btn side-btn danger" onClick={() => setShowDelete(true)} disabled={loading}>Excluir ficha</button>
            </>
          ) : (
            <div className="side-card char-tip">
              <strong>Dica</strong>
              <p>Você pode preencher só o básico agora e completar inventário, grimório e anotações depois, na ficha.</p>
            </div>
          )}
        </aside>
       </div>
      </div>

      {/* Delete confirmation modal — UC-02 S02 */}
      <Modal
        open={showDelete}
        title="Excluir Personagem"
        message="Tem certeza? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        danger
      />
    </div>
  )
}
