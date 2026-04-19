import { useState, useEffect, useCallback } from 'react'
import { useAppStore, useSelectedCharacter } from '@/store/useAppStore'
import { Modal } from '@/components/ui/Modal'
import { AvatarUpload } from '@/components/ui/AvatarUpload'
import {
  calcMod, formatMod, profBonus,
  ATTR_KEYS, ATTR_LABELS, CLASSES, RACES,
  SUBCLASSES, getRaceBonuses,
} from '@/lib/engine'
import { calcMaxHp, calcUnarmoredAC, ATTR_INPUT_MAX, ATTR_INPUT_MIN } from '@/lib/engine-hp'
import type { AttrKey, Attributes } from '@/types'

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

export function CharacterFormScreen({ mode }: Props) {
  const { navigate, addCharacter, updateCharacter, deleteCharacter, showToast } = useAppStore()
  const existing = useSelectedCharacter()
  const isEdit   = mode === 'edit'
  const title    = isEdit ? 'Editar Personagem' : 'Novo Personagem'

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
      setName(existing.name)
      setLevel(String(existing.level))
      setCls(existing.class)
      setSubclass(existing.subclass ?? '')
      setRace(existing.race)
      setMaxHp(String(existing.max_hp ?? existing.hp))
      setAc(String(existing.ac))
      setAvatarUrl(existing.avatar_url)
      const filled: Record<AttrKey, string> = { STR:'', DEX:'', CON:'', INT:'', WIS:'', CHA:'' }
      ATTR_KEYS.forEach(k => {
        // On edit, show the stored (post-bonus) value in the field.
        // The player can see and adjust it; auto-calc button applies the formula fresh.
        filled[k] = String(existing.attributes[k])
      })
      setAttrs(filled)
    }
  }, [isEdit, existing])

  const raceBonuses  = getRaceBonuses(race)
  const subclassInfo = SUBCLASSES[cls]
  const lvlNum       = parseInt(level, 10)
  const showSubclass = !!subclassInfo && !isNaN(lvlNum) && lvlNum >= subclassInfo.choiceLevel

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
      if (hp !== null) setMaxHp(String(hp))
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
    const bonuses = getRaceBonuses(race)

    // Build post-bonus attributes (player types base, system adds racial)
    const finalAttrs: Attributes = { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 }
    ATTR_KEYS.forEach(k => {
      finalAttrs[k] = parseInt(attrs[k], 10) + (bonuses[k] ?? 0)
    })

    const charData = {
      name:     name.trim(),
      class:    cls,
      subclass: showSubclass ? subclass : '',
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
      <div className="topbar">
        <button className="topbar-back" onClick={() => navigate(isEdit ? 'ficha' : 'personagens')}>←</button>
        <div className="topbar-info">
          <div className="top-title">{title}</div>
        </div>
      </div>

      <div className="page-body">

        {/* ── Character portrait ── */}
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
          <label className="form-label">Nome do Personagem</label>
          <input
            className={`form-input${errors.name ? ' error' : name.trim() ? ' valid' : ''}`}
            type="text" maxLength={100} placeholder="Ex: Aragorn"
            value={name}
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
          />
          {errors.name && <small className="error-msg">{errors.name}</small>}
        </div>

        <div className="form-row">
          <div className="form-group form-col">
            <label className="form-label">Classe</label>
            <select
              className={`form-input${errors.cls ? ' error' : cls ? ' valid' : ''}`}
              value={cls}
              onChange={e => { setCls(e.target.value); setSubclass(''); setErrors(p => ({ ...p, cls: '' })) }}
            >
              <option value="">Selecione...</option>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.cls && <small className="error-msg">{errors.cls}</small>}
          </div>
          <div className="form-group form-col">
            <label className="form-label">Raça</label>
            <select
              className={`form-input${errors.race ? ' error' : race ? ' valid' : ''}`}
              value={race}
              onChange={e => { setRace(e.target.value); setErrors(p => ({ ...p, race: '' })) }}
            >
              <option value="">Selecione...</option>
              {RACES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {errors.race && <small className="error-msg">{errors.race}</small>}
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
          <input
            className={`form-input input-center${errors.level ? ' error' : level && !errors.level ? ' valid' : ''}`}
            type="number" min={1} max={20} placeholder="1–20"
            value={level}
            onChange={e => { setLevel(e.target.value); setErrors(p => ({ ...p, level: '' })) }}
          />
          <small className="field-hint">
            Bônus de proficiência: {!isNaN(parseInt(level, 10)) ? `+${profBonus(parseInt(level, 10))}` : '—'}
          </small>
          {errors.level && <small className="error-msg">{errors.level}</small>}
        </div>

        {/* Subclass */}
        {showSubclass && (
          <div className="form-group">
            <label className="form-label">
              Subclasse
              <span className="field-hint" style={{ marginLeft: 6 }}>
                (disponível a partir do nível {subclassInfo.choiceLevel})
              </span>
            </label>
            <select
              className={`form-input${subclass ? ' valid' : ''}`}
              value={subclass}
              onChange={e => setSubclass(e.target.value)}
            >
              <option value="">Selecione (opcional)</option>
              {subclassInfo.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        )}

        {/* ── Attributes ── */}
        <h2 className="section-title" style={{ marginTop: 24 }}>Atributos</h2>
        <small className="field-hint" style={{ marginBottom: 12, display: 'block' }}>
          Digite o valor base (1–20). Bônus raciais são aplicados automaticamente ao salvar.
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
              className="btn btn-danger btn-auto"
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
