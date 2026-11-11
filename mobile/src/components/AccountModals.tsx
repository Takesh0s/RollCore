import { useState } from 'react';
import { View } from 'react-native';
import { AccessibleText as Text, AccessibleTextInput as TextInput } from './accessible-text';
import { Btn, FormGroup, PasswordField, Sheet, inputStyle } from './Controls';
import { COLORS, appFontSize } from '../design/shared';
import { ApiError } from '../services/api';
import { alterarEmail, alterarSenha, excluirConta } from '../store/conta';
import { showToast } from '../store/useToast';

const BODY = 'AtkinsonHyperlegible_400Regular';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

/** Texto de erro de uma chamada de conta, a partir do status que a API devolveu. */
function apiError(err: unknown, fallback: string, byStatus: Record<number, string>): string {
  const status = err instanceof ApiError ? err.status : undefined;
  return (status && byStatus[status]) || fallback;
}

function ErrorLine({ text }: { text: string }) {
  return text ? <Text accessibilityLiveRegion="polite" style={{ color: '#e57373', fontFamily: BODY, fontSize: appFontSize(13) }}>{text}</Text> : null;
}

/** Alterar e-mail: novo e-mail e a senha atual. */
export function ChangeEmailModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!EMAIL_RE.test(email.trim())) { setError('Digite um e-mail válido.'); return; }
    if (!password) { setError('Digite sua senha atual.'); return; }
    setBusy(true);
    try {
      await alterarEmail(email.trim().toLocaleLowerCase('pt-BR'), password);
      showToast('E-mail atualizado!', 'success');
      onClose();
    } catch (e) {
      setError(apiError(e, 'Não foi possível alterar o e-mail.', {
        403: 'Senha atual incorreta.', 409: 'Este e-mail já está em uso.', 400: 'Confira o e-mail digitado.', 429: 'Muitas tentativas. Aguarde um minuto.',
      }));
      setBusy(false);
    }
  }

  return (
    <Sheet title="Alterar e-mail" onClose={onClose}>
      <FormGroup label="Novo e-mail">
        <TextInput value={email} onChangeText={(t) => { setEmail(t); setError(''); }} keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
          autoComplete="email" placeholder="novo@email.com" placeholderTextColor={COLORS.outline} accessibilityLabel="Novo e-mail" style={inputStyle(!!error)} />
      </FormGroup>
      <FormGroup label="Senha atual">
        <PasswordField value={password} onChangeText={(t) => { setPassword(t); setError(''); }} label="Senha atual" error={!!error} />
      </FormGroup>
      <ErrorLine text={error} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Btn label="Cancelar" onPress={onClose} /></View>
        <View style={{ flex: 1 }}><Btn label={busy ? '…' : 'Salvar'} kind="primary" disabled={busy} onPress={submit} /></View>
      </View>
    </Sheet>
  );
}

/** Alterar senha: senha antiga, nova e confirmação. */
export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!current) { setError('Digite sua senha atual.'); return; }
    if (!PASSWORD_RE.test(next)) { setError('A nova senha precisa de 8 caracteres, uma maiúscula e um número.'); return; }
    if (next === current) { setError('A nova senha deve ser diferente da atual.'); return; }
    if (next !== again) { setError('A confirmação não confere com a nova senha.'); return; }
    setBusy(true);
    try {
      await alterarSenha(current, next);
      showToast('Senha alterada! Os outros aparelhos foram desconectados.', 'success');
      onClose();
    } catch (e) {
      setError(apiError(e, 'Não foi possível alterar a senha.', {
        403: 'Senha atual incorreta.', 400: 'A nova senha não atende às regras.', 429: 'Muitas tentativas. Aguarde um minuto.',
      }));
      setBusy(false);
    }
  }

  const clear = (set: (t: string) => void) => (t: string) => { set(t); setError(''); };
  return (
    <Sheet title="Alterar senha" onClose={onClose}>
      <FormGroup label="Senha antiga"><PasswordField value={current} onChangeText={clear(setCurrent)} label="Senha antiga" error={!!error} /></FormGroup>
      <FormGroup label="Nova senha" hint="Mínimo de 8 caracteres, com uma letra maiúscula e um número.">
        <PasswordField value={next} onChangeText={clear(setNext)} label="Nova senha" error={!!error} autoComplete="new-password" />
      </FormGroup>
      <FormGroup label="Confirmar nova senha"><PasswordField value={again} onChangeText={clear(setAgain)} label="Confirmar nova senha" error={!!error} autoComplete="new-password" /></FormGroup>
      <ErrorLine text={error} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Btn label="Cancelar" onPress={onClose} /></View>
        <View style={{ flex: 1 }}><Btn label={busy ? '…' : 'Salvar alterações'} kind="primary" disabled={busy} onPress={submit} /></View>
      </View>
    </Sheet>
  );
}

/** Excluir conta: só libera o botão depois de digitar EXCLUIR. */
export function DeleteAccountModal({ onClose, onDeleted }: { onClose: () => void; onDeleted: () => void }) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = typed.trim() === 'EXCLUIR';

  async function run() {
    setBusy(true);
    try {
      await excluirConta();
      showToast('Conta excluída.', 'success');
      onDeleted();
    } catch {
      showToast('Não foi possível excluir a conta.', 'error');
      setBusy(false);
    }
  }

  return (
    <Sheet title="Excluir conta?" onClose={onClose}>
      <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(14) }}>
        Essa ação é permanente: fichas, mesas e imagens da sua conta serão apagadas. Digite EXCLUIR para confirmar.
      </Text>
      <FormGroup label="Confirmação">
        <TextInput value={typed} onChangeText={setTyped} autoCapitalize="characters" autoCorrect={false} autoComplete="off" placeholder="EXCLUIR"
          placeholderTextColor={COLORS.outline} accessibilityLabel="Confirmação" style={inputStyle()} />
      </FormGroup>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Btn label="Cancelar" onPress={onClose} /></View>
        <View style={{ flex: 1 }}><Btn label={busy ? '…' : 'Excluir conta'} kind="danger" disabled={!ok || busy} onPress={run} /></View>
      </View>
    </Sheet>
  );
}
