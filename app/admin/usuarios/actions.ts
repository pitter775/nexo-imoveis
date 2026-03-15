'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { hashPassword } from '@/lib/auth/password';
import { createUsuario, updateUsuario } from '@/lib/admin/usuarios';

export async function createUsuarioAction(formData: FormData) {
  await requireAdmin();

  const payload = await parseUsuarioFormData(formData, { requirePassword: true });
  await createUsuario(payload);
  revalidatePath('/admin/usuarios');
  redirect('/admin/usuarios');
}

export async function updateUsuarioAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get('id') ?? '');
  if (!id) {
    throw new Error('User id is required.');
  }

  const payload = await parseUsuarioFormData(formData, { requirePassword: false });
  await updateUsuario(id, payload);
  revalidatePath('/admin/usuarios');
  revalidatePath(`/admin/usuarios/${id}`);
  redirect('/admin/usuarios');
}

async function parseUsuarioFormData(
  formData: FormData,
  options: { requirePassword: boolean },
) {
  const senha = String(formData.get('senha') ?? '').trim();

  if (options.requirePassword && !senha) {
    throw new Error('Password is required.');
  }

  const payload = {
    nome: String(formData.get('nome') ?? '').trim(),
    email: String(formData.get('email') ?? '')
      .trim()
      .toLowerCase(),
    tipo_usuario:
      String(formData.get('tipo_usuario') ?? '').trim() === 'admin'
        ? 'admin'
        : 'cliente',
    ativo: String(formData.get('ativo') ?? 'true') === 'true',
  } as const;

  if (!senha) {
    return payload;
  }

  return {
    ...payload,
    senha_hash: await hashPassword(senha),
  };
}
