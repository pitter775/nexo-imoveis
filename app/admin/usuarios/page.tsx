import { AdminUsuariosTable } from '@/components/admin-usuarios-table';
import { listUsuarios } from '@/lib/admin/usuarios';

export default async function AdminUsuariosPage() {
  const usuarios = await listUsuarios();

  return (
    <div className="space-y-6">
      <AdminUsuariosTable
        usuarios={usuarios}
        createHref="/admin/usuarios/novo"
      />
    </div>
  );
}
