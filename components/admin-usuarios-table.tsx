'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowDownUp, ArrowUp, Search } from 'lucide-react';
import type { UsuarioRecord } from '@/lib/admin/usuarios';

type AdminUsuariosTableProps = {
  usuarios: UsuarioRecord[];
};

type SortKey = 'nome' | 'email' | 'tipo_usuario' | 'ativo' | 'created_at';

type SortConfig = {
  key: SortKey;
  direction: 'asc' | 'desc';
};

const columns: Array<{ key: SortKey; label: string }> = [
  { key: 'nome', label: 'Usuario' },
  { key: 'email', label: 'Email' },
  { key: 'tipo_usuario', label: 'Perfil' },
  { key: 'ativo', label: 'Status' },
  { key: 'created_at', label: 'Cadastro' },
];

export function AdminUsuariosTable({ usuarios }: AdminUsuariosTableProps) {
  const [query, setQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'created_at',
    direction: 'desc',
  });

  const filteredUsuarios = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = normalizedQuery
      ? usuarios.filter((usuario) =>
          [usuario.nome ?? '', usuario.email, usuario.tipo_usuario ?? '']
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery),
        )
      : usuarios;

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
  }, [usuarios, query, sortConfig]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, email ou perfil"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
        </div>

        <div className="text-sm text-slate-500">
          {filteredUsuarios.length} {filteredUsuarios.length === 1 ? 'usuario encontrado' : 'usuarios encontrados'}
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[1.2fr_1.2fr_0.7fr_0.6fr_0.7fr_0.4fr] gap-4 border-b border-slate-100 px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-400 lg:grid">
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
          {filteredUsuarios.map((usuario) => (
            <div
              key={usuario.id}
              className="grid gap-4 px-4 py-4 text-sm text-slate-700 sm:px-6 lg:grid-cols-[1.2fr_1.2fr_0.7fr_0.6fr_0.7fr_0.4fr]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <Image
                      src={getAvatarUrl(usuario)}
                      alt={`Avatar de ${usuario.nome ?? usuario.email}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {usuario.nome || 'Sem nome'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      ID {usuario.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
              </div>

              <DataCell label="Email" value={usuario.email} />
              <DataCell
                label="Perfil"
                value={usuario.tipo_usuario === 'admin' ? 'Admin' : 'Cliente'}
              />
              <DataCell
                label="Status"
                value={usuario.ativo === false ? 'Inativo' : 'Ativo'}
              />
              <DataCell
                label="Cadastro"
                value={formatDate(usuario.created_at)}
              />

              <div className="lg:self-center">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">
                  Acoes
                </span>
                <Link
                  href={`/admin/usuarios/${usuario.id}`}
                  className="font-semibold text-primary transition hover:text-primary/80"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}

          {filteredUsuarios.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              Nenhum usuario encontrado com essa busca.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="lg:self-center">
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

function getSortableValue(usuario: UsuarioRecord, key: SortKey) {
  if (key === 'ativo') {
    return usuario.ativo === true ? 1 : 0;
  }

  return (usuario[key] ?? '').toString().toLowerCase();
}

function getAvatarUrl(usuario: UsuarioRecord) {
  const seed = encodeURIComponent(usuario.email || usuario.nome || usuario.id);
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundType=gradientLinear`;
}

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
