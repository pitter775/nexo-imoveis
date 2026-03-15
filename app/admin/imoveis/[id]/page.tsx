import { notFound } from 'next/navigation';
import { AdminImovelImages } from '@/components/admin-imovel-images';
import { AdminImovelForm } from '@/components/admin-imovel-form';
import { updateImovelAction } from '@/app/admin/imoveis/actions';
import { getImovelById, listImovelImages } from '@/lib/admin/imoveis';

type EditImovelPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditImovelPage({ params }: EditImovelPageProps) {
  const { id } = await params;
  const [imovel, images] = await Promise.all([
    getImovelById(id),
    listImovelImages(id),
  ]);

  if (!imovel) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_440px] 2xl:grid-cols-[minmax(0,1.2fr)_500px]">
        <AdminImovelForm
          title="Editar imovel"
          description="Atualize os dados do imovel selecionado."
          submitLabel="Salvar alteracoes"
          action={updateImovelAction}
          initialValues={imovel}
        />

        <AdminImovelImages imovelId={id} initialImages={images} />
      </div>
    </div>
  );
}
