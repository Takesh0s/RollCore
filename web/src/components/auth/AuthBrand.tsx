import { DiceLogo } from '@/components/ui/DiceLogo'
import { IconSheets, IconCommunity } from '@/components/ui/icons'

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
        <li><IconCommunity className="auth-brand-ico" /> Mesas, mapas e chat para o seu grupo</li>
      </ul>
    </aside>
  )
}
