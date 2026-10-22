import { useEffect, useState } from 'react';

export interface Conta {
  apelido: string;
  email: string;
  fotoUri?: string;
}

interface Credenciais extends Conta {
  senha: string;
}

let credenciais: Credenciais | null = null;
let contaAtiva: Conta | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function cadastrarConta(input: { apelido: string; email: string; senha: string }): void {
  credenciais = {
    apelido: input.apelido.trim(),
    email: input.email.trim().toLocaleLowerCase('pt-BR'),
    senha: input.senha,
  };
  contaAtiva = { apelido: credenciais.apelido, email: credenciais.email };
  emit();
}

export function autenticarConta(email: string, senha: string): boolean {
  if (!credenciais || credenciais.email !== email.trim().toLocaleLowerCase('pt-BR') || credenciais.senha !== senha) return false;
  contaAtiva = { apelido: credenciais.apelido, email: credenciais.email, fotoUri: credenciais.fotoUri };
  emit();
  return true;
}

export function obterContaAtiva(): Conta | null {
  return contaAtiva;
}

export function atualizarApelido(apelido: string): void {
  const novoApelido = apelido.trim();
  if (!novoApelido || !credenciais || !contaAtiva) return;
  credenciais = { ...credenciais, apelido: novoApelido };
  contaAtiva = { ...contaAtiva, apelido: novoApelido };
  emit();
}

export function atualizarFotoPerfil(fotoUri?: string): void {
  if (!contaAtiva) return;
  if (credenciais) credenciais = { ...credenciais, fotoUri };
  contaAtiva = { ...contaAtiva, fotoUri };
  emit();
}

export function encerrarSessao(): void {
  contaAtiva = null;
  emit();
}

export function useContaAtiva(): Conta | null {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const listener = () => forceUpdate((value) => value + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);
  return contaAtiva;
}
