import { DiceLogo } from './DiceLogo'

/** Logo pulsando, só visível se o carregamento passar de ~250 ms. */
export function Loader({ label = 'Carregando' }: { label?: string }) {
  return (
    <div className="rc-loader" role="status" aria-label={label}>
      <DiceLogo />
    </div>
  )
}
