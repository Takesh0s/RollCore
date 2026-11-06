import { AuthBrand } from '@/components/auth/AuthBrand'
import { DiceLogo } from '@/components/ui/DiceLogo'
import { useAppStore } from '@/store/useAppStore'

/**
 * Recuperação de senha — UC-01 NR-06.
 * O layout segue o Figma. O envio do link por e-mail ainda depende do backend
 * (Fase 2), então a tela explica isso em vez de simular um envio.
 */
export function ForgotPasswordScreen() {
  const { navigate } = useAppStore()

  return (
    <div className="login-device">
      <AuthBrand />
      <div className="auth-body">
      <div className="logo-wrap">
        <DiceLogo className="logo-svg" />
      </div>

      <div className="login-header">
        <h1>RollCore</h1>
        <p>Recuperar senha</p>
      </div>

      <div className="forgot-placeholder">
        <p>
          O envio do link de redefinição por e-mail chega na <strong>Fase 2</strong>,
          junto ao serviço de e-mails do backend.
        </p>
        <p style={{ marginTop: 12 }}>
          Por enquanto, crie uma nova conta para acessar o sistema.
        </p>
      </div>

      <button className="btn btn-primary" onClick={() => navigate('cadastro')}>
        Criar conta
      </button>

      <button className="link-btn" onClick={() => navigate('login')}>
        Voltar para o login
      </button>
      </div>
    </div>
  )
}
