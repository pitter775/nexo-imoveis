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
      <div className="rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
          Modulo de imoveis
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
          Editar imovel
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Atualize os dados publicos, o conteudo do dossie, os documentos e a galeria do imovel.
        </p>
      </div>

      <AdminImovelTabs
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
