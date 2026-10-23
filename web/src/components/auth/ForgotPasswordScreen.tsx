import { DiceLogo } from '@/components/ui/DiceLogo'
import { useAppStore } from '@/store/useAppStore'

/**
 * Placeholder screen for password recovery — UC-01 NR-06.
 * Full implementation (e-mail link flow) is scoped to Phase 2.
 */
export function ForgotPasswordScreen() {
  const { navigate } = useAppStore()

  return (
    <div className="device login-device">
      <div className="login-header">
        <div className="logo-wrap">
          <DiceLogo className="logo-svg" />
        </div>
        <h1>Recuperar Senha</h1>
        <p>Disponível na Fase 2</p>
      </div>

      <div className="narrow">
        <div className="forgot-placeholder">
          <p>
            A recuperação de senha por e-mail será implementada na <strong>Fase 2</strong> do projeto,
            junto ao backend Spring Boot e ao serviço de envio de e-mails.
          </p>
          <p style={{ marginTop: 12 }}>
            Por enquanto, crie uma nova conta para acessar o sistema.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => navigate('login')}>
          Voltar ao Login
        </button>

        <button className="link-btn" onClick={() => navigate('cadastro')}>
          Criar nova conta
        </button>
      </div>
    </div>
  )
}
