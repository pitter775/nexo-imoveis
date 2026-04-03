import { AdminImovelForm } from '@/components/admin-imovel-form';
import { createImovelAction } from '@/app/admin/imoveis/actions';

export default function NovoImovelPage() {
  return (
    <AdminImovelForm
      title="Cadastrar novo imovel"
      description="Comece com o titulo. Depois da criacao, abrimos o imovel completo para voce finalizar os demais dados."
      submitLabel="Criar imovel"
      action={createImovelAction}
      minimalTitleOnly
    />
  );
}
