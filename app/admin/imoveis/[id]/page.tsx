import { notFound } from 'next/navigation';
import { AdminImovelDetalhesForm } from '@/components/admin-imovel-detalhes-form';
import { AdminImovelFiles } from '@/components/admin-imovel-files';
import { AdminImovelImages } from '@/components/admin-imovel-images';
import { AdminImovelForm } from '@/components/admin-imovel-form';
import { AdminImovelTabs } from '@/components/admin-imovel-tabs';
import {
  updateImovelAction,
  updateImovelDetalhesAction,
} from '@/app/admin/imoveis/actions';
import {
  getImovelById,
  getImovelDetalhes,
  listImovelArquivos,
  listImovelImages,
} from '@/lib/admin/imoveis';

type EditImovelPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditImovelPage({ params }: EditImovelPageProps) {
  const { id } = await params;
  const [imovel, detalhes, arquivos, images] = await Promise.all([
    getImovelById(id),
    getImovelDetalhes(id),
    listImovelArquivos(id),
    listImovelImages(id),
  ]);

  if (!imovel) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <AdminImovelTabs
        publicHref={`/?imovel=${id}`}
        summary={{
          titulo: imovel.titulo,
          valor_minimo: imovel.valor_minimo,
          status: imovel.status,
          tipo_leilao: imovel.tipo_leilao,
          cidade: imovel.cidade,
          estado: imovel.estado,
          capaUrl: images[0]?.url ?? null,
        }}
        dadosTab={
          <AdminImovelForm
            title="Editar imovel"
            description="Atualize os dados do imovel selecionado."
            submitLabel="Salvar alteracoes"
            action={updateImovelAction}
            initialValues={imovel}
            showIntro={false}
          />
        }
        dossieTab={
          <AdminImovelDetalhesForm
            imovelId={id}
            action={updateImovelDetalhesAction}
            initialValues={detalhes}
          />
        }
        arquivosTab={
          <AdminImovelFiles
            imovelId={id}
            initialFiles={arquivos}
          />
        }
        imagensTab={<AdminImovelImages imovelId={id} initialImages={images} />}
      />
    </div>
  );
}
