import { AdminImovelForm } from '@/components/admin-imovel-form';
import { createImovelAction } from '@/app/admin/imoveis/actions';

export default function NovoImovelPage() {
  return (
    <AdminImovelForm
      title="Cadastrar novo imovel"
      description="Preencha os dados abaixo para adicionar um novo imovel ao modulo administrativo."
      submitLabel="Criar imovel"
      action={createImovelAction}
    />
  );
}
