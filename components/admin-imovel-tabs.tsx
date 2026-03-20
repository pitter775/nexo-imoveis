'use client';

import Image from 'next/image';
import { useEffect, useState, type ReactNode } from 'react';

type TabKey = 'dados' | 'dossie' | 'arquivos' | 'imagens';

type ImovelHeaderSummary = {
  titulo: string;
  valor_minimo: number | null;
  status: string | null;
  tipo_leilao: string | null;
  cidade: string | null;
  estado: string | null;
  capaUrl: string | null;
};

type AdminImovelTabsProps = {
  dadosTab: ReactNode;
  dossieTab: ReactNode;
  arquivosTab: ReactNode;
  imagensTab: ReactNode;
  summary: ImovelHeaderSummary;
};

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'dados', label: 'Dados do imovel' },
  { key: 'dossie', label: 'Conteudo do dossie' },
  { key: 'arquivos', label: 'Arquivos do dossie' },
  { key: 'imagens', label: 'Imagens' },
];

export function AdminImovelTabs({
  dadosTab,
  dossieTab,
  arquivosTab,
  imagensTab,
  summary,
}: AdminImovelTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('dados');

  useEffect(() => {
    const stored = window.sessionStorage.getItem('admin-imovel-active-tab');
    if (stored === 'dados' || stored === 'dossie' || stored === 'arquivos' || stored === 'imagens') {
      setActiveTab(stored);
    }
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem('admin-imovel-active-tab', activeTab);
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden p-1 sm:p-0">
        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
                Modulo de imoveis
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Editar imovel
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Atualize os dados publicos, o conteudo do dossie, os documentos e a
                galeria do imovel.
              </p>
            </div>

            <div className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0">
              <div className="inline-flex min-w-max gap-2 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      activeTab === tab.key
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white">
                {summary.capaUrl ? (
                  <Image
                    src={summary.capaUrl}
                    alt={`Capa do imovel ${summary.titulo}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Sem capa
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-base font-bold text-slate-900">
                  {summary.titulo}
                </p>
                <p className="mt-1 text-sm font-semibold text-primary">
                  {formatCurrency(summary.valor_minimo)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {[summary.cidade, summary.estado].filter(Boolean).join(' - ') || 'Localizacao nao informada'}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SummaryBadge label="Status" value={summary.status || '-'} />
              <SummaryBadge label="Leilao" value={summary.tipo_leilao || '-'} />
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'dados' ? dadosTab : null}
      {activeTab === 'dossie' ? dossieTab : null}
      {activeTab === 'arquivos' ? arquivosTab : null}
      {activeTab === 'imagens' ? imagensTab : null}
    </div>
  );
}

function SummaryBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function formatCurrency(value: number | null) {
  if (value == null) {
    return 'Valor nao informado';
  }

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
