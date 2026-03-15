import { AdminUsuarioForm } from '@/components/admin-usuario-form';
import { createUsuarioAction } from '@/app/admin/usuarios/actions';

export default function NovoUsuarioPage() {
  return (
    <AdminUsuarioForm
      title="Cadastrar novo usuario"
      description="Preencha os dados abaixo para adicionar um novo usuario ao modulo administrativo."
      submitLabel="Criar usuario"
      action={createUsuarioAction}
    />
  );
}
