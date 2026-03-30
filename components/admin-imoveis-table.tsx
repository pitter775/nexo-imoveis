'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowDownUp,
  ArrowUp,
  ArrowDown,
  BadgeDollarSign,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  EyeOff,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  bulkDeleteImoveisAction,
  deleteImovelAction,
  inactivateImovelAction,
  type BulkDeleteImoveisState,
} from '@/app/admin/imoveis/actions';
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
  | 'created_at'
  | 'data_primeiro_leilao'
  | 'data_segundo_leilao'
  | 'tipo_leilao'
  | 'valor_primeiro_leilao'
  | 'status';

type SortConfig = {
  key: SortKey;
  direction: 'asc' | 'desc';
};

const columns: Array<{ key: SortKey; label: string }> = [
  { key: 'titulo', label: 'Titulo' },
  { key: 'cidade', label: 'Cidade' },
  { key: 'created_at', label: 'Cadastro' },
  { key: 'data_primeiro_leilao', label: '1o leilao' },
  { key: 'data_segundo_leilao', label: '2o leilao' },
  { key: 'tipo_leilao', label: 'Leilao' },
  { key: 'valor_primeiro_leilao', label: '1o valor' },
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
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

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
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                disabled={total === 0}
                className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="size-4" />
                Zerar todos os imoveis
              </button>
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
                    <th key={column.key} className={column.key === 'titulo' ? 'w-[26%] px-6 py-4' : 'px-6 py-4'}>
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
                  <th className="w-[220px] px-6 py-4 text-left">Acoes</th>
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
                        <CalendarDays className="size-3.5 text-slate-400" />
                        {formatDate(imovel.created_at ?? null)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="size-3.5 text-slate-400" />
                        {formatDate(imovel.data_primeiro_leilao ?? imovel.data_leilao ?? null)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="size-3.5 text-slate-400" />
                        {formatDate(imovel.data_segundo_leilao ?? null)}
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
                        {formatCurrency(imovel.valor_primeiro_leilao ?? imovel.valor_minimo)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                        {imovel.status ?? '-'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={`/admin/imoveis/${imovel.id}`}
                          className="inline-flex items-center gap-2 font-semibold text-primary transition hover:text-primary/80"
                        >
                          <Pencil className="size-3.5" />
                          Editar
                        </Link>
                        {imovel.status !== 'inativo' ? (
                          <InlineActionForm
                            action={inactivateImovelAction}
                            imovelId={imovel.id}
                            label="Inativar"
                            icon={<EyeOff className="size-3.5" />}
                            confirmMessage={`Deseja inativar o imovel \"${imovel.titulo}\"?`}
                            tone="muted"
                          />
                        ) : null}
                        <InlineActionForm
                          action={deleteImovelAction}
                          imovelId={imovel.id}
                          label="Excluir"
                          icon={<Trash2 className="size-3.5" />}
                          confirmMessage={`Deseja excluir o imovel \"${imovel.titulo}\"? Esta acao nao pode ser desfeita.`}
                          tone="danger"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:hidden">
          <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.05fr)_auto] gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            <span>Titulo</span>
            <span>Cadastro</span>
            <span>1o leilao</span>
            <span>Status</span>
            <span className="text-right">Acoes</span>
          </div>

          {sortedImoveis.map((imovel) => (
            <div
              key={imovel.id}
              className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.05fr)_auto] gap-3 border-b border-slate-100 px-4 py-3 text-sm text-slate-700"
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
                <p className="truncate text-sm text-slate-700">
                  {formatDate(imovel.created_at ?? null)}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">{imovel.cidade ?? '-'}</p>
              </div>

              <div className="min-w-0 self-start pt-0.5">
                <p className="text-sm text-slate-700">
                  {formatDate(imovel.data_primeiro_leilao ?? imovel.data_leilao ?? null)}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {formatCurrency(imovel.valor_primeiro_leilao ?? imovel.valor_minimo)}
                </p>
              </div>

              <div className="min-w-0 self-start pt-0.5">
                <p className="text-sm text-slate-700">{imovel.status ?? '-'}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  2o: {formatDate(imovel.data_segundo_leilao ?? null)}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Link
                  href={`/admin/imoveis/${imovel.id}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 text-[11px] font-semibold text-primary transition hover:border-primary/30 hover:bg-primary/15"
                >
                  <Pencil className="size-3.5" />
                  Editar
                </Link>
                {imovel.status !== 'inativo' ? (
                  <InlineActionForm
                    action={inactivateImovelAction}
                    imovelId={imovel.id}
                    label="Inativar"
                    icon={<EyeOff className="size-3.5" />}
                    confirmMessage={`Deseja inativar o imovel \"${imovel.titulo}\"?`}
                    tone="muted"
                    compact
                  />
                ) : null}
                <InlineActionForm
                  action={deleteImovelAction}
                  imovelId={imovel.id}
                  label="Excluir"
                  icon={<Trash2 className="size-3.5" />}
                  confirmMessage={`Deseja excluir o imovel \"${imovel.titulo}\"? Esta acao nao pode ser desfeita.`}
                  tone="danger"
                  compact
                />
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

      <BulkDeleteImoveisModal
        key={isBulkDeleteModalOpen ? 'bulk-delete-open' : 'bulk-delete-closed'}
        isOpen={isBulkDeleteModalOpen}
        total={total}
        onClose={() => setIsBulkDeleteModalOpen(false)}
      />
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
  if (key === 'created_at') {
    return imovel.created_at ? new Date(imovel.created_at).getTime() : 0;
  }

  if (key === 'data_primeiro_leilao') {
    return imovel.data_primeiro_leilao
      ? new Date(imovel.data_primeiro_leilao).getTime()
      : imovel.data_leilao
        ? new Date(imovel.data_leilao).getTime()
        : 0;
  }

  if (key === 'data_segundo_leilao') {
    return imovel.data_segundo_leilao ? new Date(imovel.data_segundo_leilao).getTime() : 0;
  }

  if (key === 'valor_primeiro_leilao') {
    return imovel.valor_primeiro_leilao ?? imovel.valor_minimo ?? 0;
  }

  return (imovel[key] ?? '').toString().toLowerCase();
}

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCurrency(value: number | null | undefined) {
  if (value == null) {
    return '-';
  }

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function InlineActionForm({
  action,
  imovelId,
  label,
  icon,
  confirmMessage,
  tone,
  compact = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  imovelId: string;
  label: string;
  icon: ReactNode;
  confirmMessage: string;
  tone: 'muted' | 'danger';
  compact?: boolean;
}) {
  const className =
    tone === 'danger'
      ? 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100'
      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100';

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={imovelId} />
      <button
        type="submit"
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 font-semibold transition ${className} ${
          compact ? 'h-8 text-[11px]' : 'h-9 text-xs'
        }`}
      >
        {icon}
        {label}
      </button>
    </form>
  );
}

const bulkDeleteInitialState: BulkDeleteImoveisState = {};

function BulkDeleteImoveisModal({
  isOpen,
  total,
  onClose,
}: {
  isOpen: boolean;
  total: number;
  onClose: () => void;
}) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [clientError, setClientError] = useState('');
  const [state, formAction, isPending] = useActionState(
    bulkDeleteImoveisAction,
    bulkDeleteInitialState,
  );
  const expectedConfirmation = 'eu qro remover todos os imovies';
  const isConfirmationValid = confirmationInput.trim() === expectedConfirmation;

  useEffect(() => {
    if (!isOpen) {
      setConfirmationInput('');
      setClientError('');
      return;
    }

    setClientError('');
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
      <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
            <CircleAlert className="size-6" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-rose-600">
              Acao irreversivel
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
              Remover todos os imoveis
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Isso vai apagar {total} {total === 1 ? 'imovel' : 'imoveis'} e todos os
              dados relacionados, incluindo imagens, arquivos enviados, extracoes,
              chats, acessos, leiloes e itens vinculados.
            </p>
          </div>
        </div>

        <form
          action={formAction}
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            if (isConfirmationValid) {
              setClientError('');
              return;
            }

            event.preventDefault();
            setClientError('Digite a frase exatamente como exibida para liberar a remocao.');
          }}
        >
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Digite a frase para confirmar: <strong>{expectedConfirmation}</strong>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Frase de confirmacao</span>
            <input
              name="confirmation"
              value={confirmationInput}
              onChange={(event) => setConfirmationInput(event.target.value)}
              placeholder={expectedConfirmation}
              autoFocus
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
            />
          </label>

          {clientError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {clientError}
            </div>
          ) : null}

          {state.error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {state.error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isConfirmationValid || isPending}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
            >
              <Trash2 className="size-4" />
              {isPending ? 'Removendo...' : 'Remover tudo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
