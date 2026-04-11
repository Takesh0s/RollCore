import { useState, useEffect, useCallback } from 'react'
import { useAppStore, useSelectedCharacter } from '@/store/useAppStore'
import { Modal } from '@/components/ui/Modal'
import { calcMod, formatMod, profBonus, ATTR_KEYS, ATTR_LABELS, CLASSES, RACES } from '@/lib/engine'
import type { AttrKey, Attributes } from '@/types'

type Mode = 'new' | 'edit'

interface Props { mode: Mode }

// ── Attribute field ────────────────────────────────────────────────────────────

interface AttrFieldProps {
  attrKey: AttrKey
  value: string
  onChange: (key: AttrKey, val: string) => void
  error?: string
}

/**
 * Single attribute input that shows a live modifier preview.
 * Modifier is displayed as '—' when the value is out of the valid range (1–20).
 */
function AttrField({ attrKey, value, onChange, error }: AttrFieldProps) {
  const num = parseInt(value, 10)
  const mod = !isNaN(num) && num >= 1 && num <= 20 ? formatMod(calcMod(num)) : '—'

  return (
    <div className="attr-form-item">
      <span className="attr-form-label">{ATTR_LABELS[attrKey]}</span>
      <input
        className={`form-input input-center${error ? ' error' : value && !error ? ' valid' : ''}`}
        type="number"
        min={1}
        max={20}
        placeholder="1–20"
        value={value}
        onChange={e => onChange(attrKey, e.target.value)}
      />
      <div className="attr-form-mod">{mod}</div>
      {error && <small className="error-msg">{error}</small>}
    </div>
  )
}

// ── Main form ──────────────────────────────────────────────────────────────────

/**
 * Unified create/edit form for character sheets.
 * Controlled by the `mode` prop — 'new' starts with blank fields,
 * 'edit' pre-fills from the currently selected character.
 */
export function CharacterFormScreen({ mode }: Props) {
  const { navigate, addCharacter, updateCharacter, deleteCharacter, showToast } = useAppStore()
  const existing = useSelectedCharacter()

  const isEdit = mode === 'edit'
  const title  = isEdit ? 'Editar Personagem' : 'Novo Personagem'

  const [name,  setName]  = useState('')
  const [level, setLevel] = useState('')
  const [cls,   setCls]   = useState('')
  const [race,  setRace]  = useState('')

  // Attribute values are stored as strings so controlled inputs work naturally
  const [attrs, setAttrs] = useState<Record<AttrKey, string>>({
    STR: '', DEX: '', CON: '', INT: '', WIS: '', CHA: '',
  })

  const [maxHp, setMaxHp] = useState('')
  const [ac,    setAc]    = useState('')

  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [showDelete, setShowDelete] = useState(false)

  // Pre-fill all fields when opening an existing character — UC-02 S01
  useEffect(() => {
    if (isEdit && existing) {
      setName(existing.name)
      setLevel(String(existing.level))
      setCls(existing.class)
      setRace(existing.race)
      setMaxHp(String(existing.max_hp ?? existing.hp))
      setAc(String(existing.ac))
      const filled: Record<AttrKey, string> = { STR: '', DEX: '', CON: '', INT: '', WIS: '', CHA: '' }
      ATTR_KEYS.forEach(k => { filled[k] = String(existing.attributes[k]) })
      setAttrs(filled)
    }
  }, [isEdit, existing])

  // Live proficiency bonus preview updates as the level field changes — UC-02 RN-03
  const lvNum      = parseInt(level, 10)
  const profPreview = !isNaN(lvNum) && lvNum >= 1 && lvNum <= 20
    ? `+${profBonus(lvNum)}`
    : '+?'

  const handleAttrChange = useCallback((key: AttrKey, val: string) => {
    setAttrs(prev => ({ ...prev, [key]: val }))
  }, [])

  function validate(): boolean {
    const errs: Record<string, string> = {}

    if (!name.trim()) errs.name  = 'Informe o nome do personagem'
    if (!cls)         errs.class = 'Selecione a classe'
    if (!race)        errs.race  = 'Selecione a raça'

    // Level must be an integer between 1 and 20 — UC-02 E01 / MSG004
    const lvNum = parseInt(level, 10)
    if (!level || isNaN(lvNum) || lvNum < 1 || lvNum > 20)
      errs.level = 'Nível inválido. Informe um valor entre 1 e 20.'

    // Each attribute must be an integer between 1 and 20 — UC-02 E03
    ATTR_KEYS.forEach(k => {
      const v = parseInt(attrs[k], 10)
      if (!attrs[k] || isNaN(v) || v < 1 || v > 20)
        errs[`attr_${k}`] = 'Valor deve ser entre 1 e 20'
    })

    const hp  = parseInt(maxHp, 10)
    const acN = parseInt(ac, 10)
    if (!maxHp || isNaN(hp) || hp < 1)    errs.combat = 'Informe HP Máximo e CA válidos'
    if (ac === '' || isNaN(acN) || acN < 0) errs.combat = 'Informe HP Máximo e CA válidos'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSave() {
    if (!validate()) return

    const attributes = ATTR_KEYS.reduce((acc, key) => {
      acc[key] = parseInt(attrs[key], 10)
      return acc
    }, {} as Attributes)

    const data = {
      name: name.trim(),
      class: cls,
      race,
      level: parseInt(level, 10),
      hp:     parseInt(maxHp, 10),
      max_hp: parseInt(maxHp, 10),
      ac:     parseInt(ac, 10),
      attributes,
    }

    if (isEdit && existing) {
      updateCharacter(existing.id, data)
      showToast('Alterações salvas com sucesso!', 'success')
    } else {
      addCharacter(data)
      showToast('Personagem salvo com sucesso!', 'success') // MSG005
    }

    navigate('personagens')
  }

  function handleDelete() {
    if (!existing) return
    deleteCharacter(existing.id)
    showToast('Personagem excluído.')
    navigate('personagens')
  }

  return (
    <>
      <div className="device">
        <div className="topbar">
          <button className="topbar-back" onClick={() => navigate('personagens')}>←</button>
          <div className="topbar-info">
            <div className="top-title">{title}</div>
          </div>
        </div>

        <div className="page-body">

          {/* ── Identity ── */}
          <h2 className="section-title">Identidade</h2>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Nome</label>
              <input
                className={`form-input${errors.name ? ' error' : name ? ' valid' : ''}`}
                placeholder="Ex: Thorin Kettleback"
                maxLength={100}
                value={name}
                onChange={e => setName(e.target.value)}
              />
              {errors.name && <small className="error-msg">{errors.name}</small>}
            </div>

            <div className="form-group">
              <label className="form-label">Nível (1–20)</label>
              <input
                className={`form-input${errors.level ? ' error' : level && !errors.level ? ' valid' : ''}`}
                type="number"
                min={1}
                max={20}
                placeholder="1–20"
                value={level}
                onChange={e => setLevel(e.target.value)}
              />
              {errors.level && <small className="error-msg">{errors.level}</small>}
            </div>

            <div className="form-group">
              <label className="form-label">Classe</label>
              <select
                className={`form-input${errors.class ? ' error' : cls ? ' valid' : ''}`}
                value={cls}
                onChange={e => setCls(e.target.value)}
              >
                <option value="">Selecione a classe</option>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
              {errors.class && <small className="error-msg">{errors.class}</small>}
            </div>

            <div className="form-group">
              <label className="form-label">Raça</label>
              <select
                className={`form-input${errors.race ? ' error' : race ? ' valid' : ''}`}
                value={race}
                onChange={e => setRace(e.target.value)}
              >
                <option value="">Selecione a raça</option>
                {RACES.map(r => <option key={r}>{r}</option>)}
              </select>
              {errors.race && <small className="error-msg">{errors.race}</small>}
            </div>
          </div>

          {/* ── Attributes — UC-02 E03 ── */}
          <h2 className="section-title" style={{ marginTop: 6 }}>Atributos (1–20)</h2>
          <div className="attr-form-grid">
            {ATTR_KEYS.map(k => (
              <AttrField
                key={k}
                attrKey={k}
                value={attrs[k]}
                onChange={handleAttrChange}
                error={errors[`attr_${k}`]}
              />
            ))}
          </div>

          {/* ── Combat ── */}
          <h2 className="section-title" style={{ marginTop: 6 }}>Combate</h2>
          <div className="attr-grid">
            <div className="attr-box">
              <span className="attr-box-label">Proficiência</span>
              {/* Read-only — derived from level — UC-02 RN-03 */}
              <strong className="attr-box-value" style={{ fontSize: 22 }}>{profPreview}</strong>
              <span className="attr-box-mod">calculado</span>
            </div>
            <div className="attr-box">
              <span className="attr-box-label">HP Máx.</span>
              <input
                className={`form-input input-center${errors.combat ? ' error' : ''}`}
                type="number"
                min={1}
                placeholder="0"
                value={maxHp}
                onChange={e => setMaxHp(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </div>
            <div className="attr-box">
              <span className="attr-box-label">CA</span>
              <input
                className={`form-input input-center${errors.combat ? ' error' : ''}`}
                type="number"
                min={0}
                placeholder="0"
                value={ac}
                onChange={e => setAc(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </div>
          </div>
          {errors.combat && <small className="error-msg">{errors.combat}</small>}

          {/* ── Actions ── */}
          <div className="form-actions">
            {/* Delete button only visible in edit mode — RF0002.6 / UC-02 I01 Cmd 3 */}
            {isEdit && (
              <button className="btn btn-danger" onClick={() => setShowDelete(true)}>
                Excluir
              </button>
            )}
            <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
              <button className="btn btn-outline btn-auto" onClick={() => navigate('personagens')}>
                Cancelar
              </button>
              <button className="btn btn-primary btn-auto" style={{ marginTop: 0 }} onClick={handleSave}>
                {isEdit ? 'Salvar Alterações' : 'Salvar Personagem'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation dialog before hard-deleting the character — UC-02 S02 */}
      {showDelete && (
        <Modal
          title="Excluir Personagem"
          body="Tem certeza? Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </>
  )
}
