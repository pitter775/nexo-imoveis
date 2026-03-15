'use client';

import { useState, type ReactNode } from 'react';

type TabKey = 'dados' | 'dossie' | 'arquivos' | 'imagens';

type AdminImovelTabsProps = {
  dadosTab: ReactNode;
  dossieTab: ReactNode;
  arquivosTab: ReactNode;
  imagensTab: ReactNode;
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
}: AdminImovelTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('dados');

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dados' ? dadosTab : null}
      {activeTab === 'dossie' ? dossieTab : null}
      {activeTab === 'arquivos' ? arquivosTab : null}
      {activeTab === 'imagens' ? imagensTab : null}
    </div>
  );
}
