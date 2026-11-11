import { useAcessibilidade } from '../store/acessibilidade';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AccessibleText as Text } from '../components/accessible-text';
import { AuthButton, AuthField, AuthLink, AuthShell } from '../components/AuthParts';
import { appFontSize } from '../design/shared';
import { mensagemDeErro } from '../services/api';
import { SLOW_HINT_TEXT, useSlowHint } from '../services/useSlowHint';
import { cadastrarConta } from '../store/conta';
import { showToast } from '../store/useToast';
import { AUTH_COLORS } from '../design/shared';

const USERNAME_MSG = '3–20 caracteres. Apenas letras, números e _';
const EMAIL_MSG = 'Informe um e-mail válido';
const PASS_MSG = 'Senha fraca. Use ao menos 8 caracteres, uma letra maiúscula e um número.';
const MATCH_MSG = 'As senhas não coincidem';
const STRENGTH_COLORS = ['', '#e05555', '#e8a020', '#d4b830', '#4ade80'];

const validUsername = (u: string) => /^[a-zA-Z0-9_]{3,20}$/.test(u);
const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isStrong = (p: string) => p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p);
const strengthScore = (p: string) => [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), p.length >= 12].filter(Boolean).length;

/** Cadastro, no mesmo fluxo do web: validação por campo, barra de força da senha e erros do servidor no campo certo. */
export default function CadastroScreen() {
  useAcessibilidade();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [usernameErr, setUsernameErr] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [passErr, setPassErr] = useState('');
  const [confirmErr, setConfirmErr] = useState('');
  const [loading, setLoading] = useState(false);
  const lento = useSlowHint(loading);
  const score = strengthScore(pass);

  const blurUsername = () => { const v = username.trim(); if (v) setUsernameErr(validUsername(v) ? '' : USERNAME_MSG); };
  const blurEmail = () => { const v = email.trim(); if (v) setEmailErr(validEmail(v) ? '' : EMAIL_MSG); };
  const changePass = (v: string) => {
    setPass(v);
    setPassErr(v && !isStrong(v) ? PASS_MSG : '');
    if (confirm) setConfirmErr(confirm !== v ? MATCH_MSG : '');
  };
  const changeConfirm = (v: string) => { setConfirm(v); setConfirmErr(v && v !== pass ? MATCH_MSG : ''); };

  const register = async () => {
    if (loading) return;
    const u = username.trim();
    const e = email.trim();
    let ok = true;
    if (!validUsername(u)) { setUsernameErr(USERNAME_MSG); ok = false; }
    if (!validEmail(e)) { setEmailErr(EMAIL_MSG); ok = false; }
    if (!isStrong(pass)) { setPassErr(PASS_MSG); ok = false; }
    if (pass !== confirm) { setConfirmErr(MATCH_MSG); ok = false; }
    if (!ok) return;
    setLoading(true);
    try {
      await cadastrarConta({ apelido: u, email: e, senha: pass });
      router.replace('/inicio');
    } catch (error) {
      // Conflito de e-mail ou usuário vem do servidor: a mensagem vai para o campo certo.
      const msg = mensagemDeErro(error);
      if (/e-?mail/i.test(msg)) setEmailErr(msg);
      else if (/usu[aá]rio|username/i.test(msg)) setUsernameErr(msg);
      else showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell subtitle="Cadastro">
      <AuthField label="Nome de usuário" value={username} onChangeText={(v) => { setUsername(v); setUsernameErr(''); }} onBlur={blurUsername}
        error={usernameErr} valid={!!username && !usernameErr && validUsername(username.trim())} placeholder="3–20 caracteres. Letras, números e _ apenas" maxLength={20} autoComplete="username" />
      <AuthField label="e-mail" value={email} onChangeText={(v) => { setEmail(v); setEmailErr(''); }} onBlur={blurEmail}
        error={emailErr} valid={!!email && !emailErr && validEmail(email.trim())} placeholder="seu@email.com" keyboardType="email-address" autoComplete="email" />
      <View>
        <AuthField label="senha" password value={pass} onChangeText={changePass} error={passErr} valid={!!pass && !passErr}
          placeholder="Mín. 8 caracteres, 1 maiúscula e 1 número" autoComplete="new-password" />
        <View accessibilityLabel={`Força da senha: ${score} de 4`} style={{ height: 4, marginTop: -6, marginBottom: 12, borderRadius: 2, backgroundColor: AUTH_COLORS.gray, opacity: 0.6, overflow: 'hidden' }}>
          <View style={{ width: `${score * 25}%`, height: '100%', backgroundColor: STRENGTH_COLORS[score] || 'transparent' }} />
        </View>
      </View>
      <AuthField label="confirmar senha" password value={confirm} onChangeText={changeConfirm} error={confirmErr} valid={!!confirm && !confirmErr} autoComplete="new-password" />

      <AuthButton label="Criar conta" onPress={register} busy={loading} />
      {lento ? <Text accessibilityLiveRegion="polite" style={{ color: AUTH_COLORS.white, textAlign: 'center', fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(13), marginTop: 8 }}>{SLOW_HINT_TEXT}</Text> : null}
      <AuthLink hint="Já tenho conta?" label="Entrar" onPress={() => router.replace('/login')} />
    </AuthShell>
  );
}
