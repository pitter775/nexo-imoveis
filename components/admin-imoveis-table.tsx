'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowDownUp, ArrowUp, ArrowDown, Search } from 'lucide-react';
import type { ImovelRecord } from '@/lib/admin/imoveis';

type AdminImoveisTableProps = {
  imoveis: ImovelRecord[];
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

export function AdminImoveisTable({ imoveis }: AdminImoveisTableProps) {
  const [query, setQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'titulo',
    direction: 'asc',
  });

  const filteredImoveis = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = normalizedQuery
      ? imoveis.filter((imovel) =>
          [
            imovel.titulo,
            imovel.descricao ?? '',
            imovel.cidade ?? '',
            imovel.estado ?? '',
            imovel.tipo_leilao ?? '',
            imovel.status ?? '',
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery),
        )
      : imoveis;

    return [...filtered].sort((left, right) => {
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
  }, [imoveis, query, sortConfig]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por titulo, cidade, status ou leilao"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
        </div>

        <div className="text-sm text-slate-500">
          {filteredImoveis.length} {filteredImoveis.length === 1 ? 'imovel encontrado' : 'imoveis encontrados'}
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[1.6fr_0.9fr_0.8fr_0.9fr_0.7fr_0.5fr] gap-4 border-b border-slate-100 px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-400 lg:grid">
          {columns.map((column) => (
            <button
              key={column.key}
              type="button"
              onClick={() => handleSort(column.key, sortConfig, setSortConfig)}
              className="inline-flex items-center gap-2 text-left transition hover:text-slate-700"
            >
              <span>{column.label}</span>
              <SortIcon active={sortConfig.key === column.key} direction={sortConfig.direction} />
            </button>
          ))}
          <span>Acoes</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredImoveis.map((imovel) => (
            <div
              key={imovel.id}
              className="grid gap-4 px-4 py-4 text-sm text-slate-700 sm:px-6 lg:grid-cols-[1.6fr_0.9fr_0.8fr_0.9fr_0.7fr_0.5fr]"
            >
              <div className="min-w-0 lg:min-w-0">
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

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{imovel.titulo}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                      {imovel.descricao}
                    </p>
                    <div className="mt-3 lg:hidden">
                      <Link
                        href={`/admin/imoveis/${imovel.id}`}
                        className="inline-flex items-center rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
                      >
                        Editar
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:contents">
                <DataCell label="Cidade" value={imovel.cidade ?? '-'} />
                <DataCell label="Leilao" value={imovel.tipo_leilao ?? '-'} />
                <DataCell
                  label="Valor minimo"
                  value={(imovel.valor_minimo ?? 0).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                />
                <DataCell label="Status" value={imovel.status ?? '-'} />
              </div>

              <div className="hidden lg:block lg:self-center">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                  Acoes
                </span>
                <Link
                  href={`/admin/imoveis/${imovel.id}`}
                  className="font-semibold text-primary transition hover:text-primary/80"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}

          {filteredImoveis.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              Nenhum imovel encontrado com essa busca.
            </div>
          ) : null}
        </div>
      </div>
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
