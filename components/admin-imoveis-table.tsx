'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowDownUp,
  ArrowUp,
  ArrowDown,
  BadgeDollarSign,
  Building2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  Search,
} from 'lucide-react';
import type { ImovelRecord } from '@/lib/admin/imoveis';

type AdminImoveisTableProps = {
  imoveis: ImovelRecord[];
  currentPage: number;
  query: string;
  total: number;
  totalPages: number;
  createHref: string;
};

type SortKey =
  | 'titulo'
  | 'cidade'
  | 'tipo_leilao'
  | 'valor_minimo'
  | 'status';

type SortConfig = {
  key: SortKey;
  direction: 'asc' | 'desc';
};

const columns: Array<{ key: SortKey; label: string }> = [
  { key: 'titulo', label: 'Titulo' },
  { key: 'cidade', label: 'Cidade' },
  { key: 'tipo_leilao', label: 'Leilao' },
  { key: 'valor_minimo', label: 'Valor minimo' },
  { key: 'status', label: 'Status' },
];

export function AdminImoveisTable({
  imoveis,
  currentPage,
  query,
  total,
  totalPages,
  createHref,
}: AdminImoveisTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [queryInput, setQueryInput] = useState(query);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'titulo',
    direction: 'asc',
  });

  useEffect(() => {
    setQueryInput(query);
  }, [query]);

  const sortedImoveis = useMemo(() => {
    return [...imoveis].sort((left, right) => {
      const leftValue = getSortableValue(left, sortConfig.key);
      const rightValue = getSortableValue(right, sortConfig.key);

      if (leftValue < rightValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }

      if (leftValue > rightValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }

      return 0;
    });
  }, [imoveis, sortConfig]);

  const updateParams = (nextPage: number, nextQuery: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextQuery) {
      params.set('q', nextQuery);
    } else {
      params.delete('q');
    }

    if (nextPage > 1) {
      params.set('page', String(nextPage));
    } else {
      params.delete('page');
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams(1, queryInput.trim());
  };

  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const startItem = total === 0 ? 0 : (currentPage - 1) * 18 + 1;
  const endItem = total === 0 ? 0 : startItem + sortedImoveis.length - 1;

  return (
    <div className="space-y-5">
      <div className="px-1 sm:px-0">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
                <Building2 className="size-4" />
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
              href={createHref}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
            >
              <Plus className="size-4" />
              Novo imovel
            </Link>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder="Buscar por titulo, cidade, status ou leilao"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-24 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                Buscar
              </button>
            </form>

            <div className="text-sm text-slate-500">
              {total} {total === 1 ? 'imovel encontrado' : 'imoveis encontrados'}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed border-collapse">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-400">
                  {columns.map((column) => (
                    <th key={column.key} className={column.key === 'titulo' ? 'w-[32%] px-6 py-4' : 'px-6 py-4'}>
                      <button
                        type="button"
                        onClick={() => handleSort(column.key, sortConfig, setSortConfig)}
                        className="inline-flex items-center gap-2 text-left transition hover:text-slate-700"
                      >
                        <span>{column.label}</span>
                        <SortIcon active={sortConfig.key === column.key} direction={sortConfig.direction} />
                      </button>
                    </th>
                  ))}
                  <th className="w-[120px] px-6 py-4 text-left">Acoes</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sortedImoveis.map((imovel) => (
                  <tr key={imovel.id} className="align-top text-sm text-slate-700">
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                          {imovel.capa_url ? (
                            <Image
                              src={imovel.capa_url}
                              alt={`Capa do imovel ${imovel.titulo}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                              Sem capa
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{imovel.titulo}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {imovel.descricao}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="size-3.5 text-slate-400" />
                        {imovel.cidade ?? '-'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-2">
                        <Building2 className="size-3.5 text-slate-400" />
                        {imovel.tipo_leilao ?? '-'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-2">
                        <BadgeDollarSign className="size-3.5 text-slate-400" />
                        {(imovel.valor_minimo ?? 0).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                        {imovel.status ?? '-'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <Link
                        href={`/admin/imoveis/${imovel.id}`}
                        className="inline-flex items-center gap-2 font-semibold text-primary transition hover:text-primary/80"
                      >
                        <Pencil className="size-3.5" />
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:hidden">
          <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,0.95fr)_minmax(0,1.1fr)_auto] gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            <span>Titulo</span>
            <span>Cidade</span>
            <span>Valor</span>
            <span className="text-right">Acoes</span>
          </div>

          {sortedImoveis.map((imovel) => (
            <div
              key={imovel.id}
              className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,0.95fr)_minmax(0,1.1fr)_auto] gap-3 border-b border-slate-100 px-4 py-3 text-sm text-slate-700"
            >
              <div className="min-w-0">
                <div className="flex items-start gap-2.5">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {imovel.capa_url ? (
                      <Image
                        src={imovel.capa_url}
                        alt={`Capa do imovel ${imovel.titulo}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Sem capa
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">
                      {imovel.titulo}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                      {imovel.descricao}
                    </p>
                  </div>
                </div>
              </div>

              <div className="min-w-0 self-start pt-0.5">
                <p className="truncate text-sm text-slate-700">{imovel.cidade ?? '-'}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  {imovel.tipo_leilao ?? '-'}
                </p>
              </div>

              <div className="min-w-0 self-start pt-0.5">
                <p className="text-sm font-semibold text-slate-900">
                  {(imovel.valor_minimo ?? 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
                <p className="mt-1 text-[11px] capitalize text-slate-500">
                  {imovel.status ?? '-'}
                </p>
              </div>

              <div className="flex justify-end">
                <Link
                  href={`/admin/imoveis/${imovel.id}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 text-[11px] font-semibold text-primary transition hover:border-primary/30 hover:bg-primary/15"
                >
                  <Pencil className="size-3.5" />
                  Editar
                </Link>
              </div>
            </div>
          ))}

          {sortedImoveis.length === 0 ? (
            <div className="flex items-center gap-3 px-6 py-10 text-sm text-slate-500">
              <Search className="size-4 text-primary" />
              Nenhum imovel encontrado com essa busca.
            </div>
          ) : null}
        </div>
      </div>

      {total > 0 ? (
        <div className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p className="text-sm text-slate-500">
            Exibindo {startItem} a {endItem} de {total} imoveis
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateParams(currentPage - 1, query)}
              disabled={!hasPreviousPage}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="size-4" />
              Anterior
            </button>

            <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
              Pagina {currentPage} de {totalPages}
            </span>

            <button
              type="button"
              onClick={() => updateParams(currentPage + 1, query)}
              disabled={!hasNextPage}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Proxima
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:self-center">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
        {label}
      </span>
      <span>{value}</span>
    </div>
  );
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: 'asc' | 'desc';
}) {
  if (!active) {
    return <ArrowDownUp className="size-3.5" />;
  }

  return direction === 'asc' ? (
    <ArrowUp className="size-3.5 text-primary" />
  ) : (
    <ArrowDown className="size-3.5 text-primary" />
  );
}

function handleSort(
  key: SortKey,
  current: SortConfig,
  setSortConfig: (config: SortConfig) => void,
) {
  if (current.key === key) {
    setSortConfig({
      key,
      direction: current.direction === 'asc' ? 'desc' : 'asc',
    });
    return;
  }

  setSortConfig({ key, direction: 'asc' });
}

function getSortableValue(imovel: ImovelRecord, key: SortKey) {
  if (key === 'valor_minimo') {
    return imovel.valor_minimo ?? 0;
  }

  return (imovel[key] ?? '').toString().toLowerCase();
}
