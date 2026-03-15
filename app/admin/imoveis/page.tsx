import Link from 'next/link';
import { AdminImoveisTable } from '@/components/admin-imoveis-table';
import { listImoveisPage } from '@/lib/admin/imoveis';

type AdminImoveisPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
};

export default async function AdminImoveisPage({
  searchParams,
}: AdminImoveisPageProps) {
  const params = await searchParams;
  const currentPage = Number(params.page ?? '1');
  const page = Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1;
  const query = params.q?.trim() ?? '';
  const { imoveis, total, totalPages } = await listImoveisPage({
    page,
    pageSize: 18,
    query,
  });

  return (
    <div className="space-y-6">
      <AdminImoveisTable
        imoveis={imoveis}
        currentPage={page}
        query={query}
        total={total}
        totalPages={totalPages}
        createHref="/admin/imoveis/novo"
      />
    </div>
  );
}
