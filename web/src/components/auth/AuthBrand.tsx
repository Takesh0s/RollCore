import { DiceLogo } from '@/components/ui/DiceLogo'
import { IconSheets } from '@/components/ui/icons'
import { NavIcon } from '@/components/ui/NavIcon'

/**
 * Painel de apresentação das telas de acesso no computador (Figma PC):
 * logo, nome, frase e três destaques. Fica escondido no celular via CSS.
 */
export function AuthBrand() {
  return (
    <aside className="auth-brand" aria-hidden="true">
      <DiceLogo className="auth-brand-logo" />
      <div className="auth-brand-name">RollCore</div>
      <p className="auth-brand-tag">Sua mesa de RPG, em qualquer lugar.</p>
      <ul className="auth-brand-list">
        <li><DiceLogo className="auth-brand-ico" /> Rolador de dados com histórico por mesa</li>
        <li><IconSheets className="auth-brand-ico" /> Fichas completas de D&amp;D 5e e outros sistemas</li>
        <li><span className="auth-brand-ico"><NavIcon name="tables" /></span> Mesas, mapas e chat para o seu grupo</li>
      </ul>
    </aside>
  )
}
