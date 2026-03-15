import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

export type UsuarioRecord = {
  id: string;
  nome: string | null;
  email: string;
  senha_hash: string | null;
  tipo_usuario: 'admin' | 'cliente' | null;
  ativo: boolean | null;
  created_at: string | null;
};

export type UsuarioInput = {
  nome: string;
  email: string;
  tipo_usuario: 'admin' | 'cliente';
  ativo: boolean;
  senha_hash?: string;
};

export async function listUsuarios() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, nome, email, senha_hash, tipo_usuario, ativo, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  return (data ?? []) as UsuarioRecord[];
}

export async function getUsuarioById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, nome, email, senha_hash, tipo_usuario, ativo, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  return (data as UsuarioRecord | null) ?? null;
}

export async function createUsuario(input: UsuarioInput) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('users').insert(input);

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

export async function updateUsuario(id: string, input: UsuarioInput) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('users').update(input).eq('id', id);

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
}
