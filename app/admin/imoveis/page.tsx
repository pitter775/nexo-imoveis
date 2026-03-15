import Link from 'next/link';
import { AdminImoveisTable } from '@/components/admin-imoveis-table';
import { listImoveis } from '@/lib/admin/imoveis';

export default async function AdminImoveisPage() {
  const imoveis = await listImoveis();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
            Imoveis
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            Gestao de imoveis
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Liste, crie e edite os imoveis disponiveis na plataforma.
          </p>
        </div>

        <Link
          href="/admin/imoveis/novo"
          className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
        >
          Novo imovel
        </Link>
      </div>

      <AdminImoveisTable imoveis={imoveis} />
    </div>
  );
}
