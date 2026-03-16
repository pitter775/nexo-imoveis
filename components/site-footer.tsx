'use client';

type SiteFooterProps = {
  onNavigate?: (sectionId: string) => void;
};

const footerItems = [
  { label: 'Home', id: 'topo' },
  { label: 'Sobre Nos', id: 'sobre' },
  { label: 'Servicos', id: 'servicos' },
  { label: 'Planos', id: 'planos' },
];

export function SiteFooter({ onNavigate }: SiteFooterProps) {
  return (
    <footer className="w-full bg-slate-950 px-4 py-10 pb-28 text-slate-200 shadow-2xl sm:px-6 sm:pb-10 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
            Nexo Leiloes
          </p>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">
            Especialistas em oportunidades de leiloes imobiliarios com analise,
            estrategia e acompanhamento completo.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-white">
            Menu
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300 sm:grid-cols-4 md:grid-cols-2">
            {footerItems.map((item) =>
              onNavigate ? (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className="text-left transition hover:text-white"
                >
                  {item.label}
                </button>
              ) : (
                <span key={item.id}>{item.label}</span>
              ),
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-white">
            Endereco
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Praca Samuel Sabatini, 226 - Centro
            <br />
            Sao Bernardo do Campo/SP
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-white">
            Contato
          </h3>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            (11) 91675-1213
            <br />
            contato@nexoleiloes.com.br
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-slate-200">
            <span className="rounded-full border border-slate-800 px-4 py-2">
              Instagram
            </span>
            <span className="rounded-full border border-slate-800 px-4 py-2">
              Youtube
            </span>
            <span className="rounded-full border border-slate-800 px-4 py-2">
              Linkedin
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
