import { notFound } from 'next/navigation';
import { AdminUsuarioForm } from '@/components/admin-usuario-form';
import { updateUsuarioAction } from '@/app/admin/usuarios/actions';
import { getUsuarioById } from '@/lib/admin/usuarios';

type EditUsuarioPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditUsuarioPage({
  params,
}: EditUsuarioPageProps) {
  const { id } = await params;
  const usuario = await getUsuarioById(id);

  if (!usuario) {
    notFound();
  }

  return (
    <AdminUsuarioForm
      title="Editar usuario"
      description="Atualize os dados do usuario selecionado."
      submitLabel="Salvar alteracoes"
      action={updateUsuarioAction}
      initialValues={usuario}
      isEdit
    />
  );
}
