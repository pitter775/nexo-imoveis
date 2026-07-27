'use client';

import Link from 'next/link';
import {
  Building2,
  Compass,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  PlayCircle,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

type SiteFooterProps = {
  onNavigate?: (sectionId: string) => void;
};

const footerItems = [
  { label: 'Home', id: 'topo', icon: Compass },
  { label: 'Sobre Nos', id: 'sobre', icon: Building2 },
  { label: 'Servicos', id: 'servicos', icon: MessageCircle },
  { label: 'Oportunidades', id: 'planos', icon: PlayCircle },
  { label: 'FAQ', id: 'faq', icon: MessageCircle },
];

const legalItems = [
  { label: 'Política de Privacidade', href: '/politica-de-privacidade' },
  { label: 'Termos de Uso', href: '/termos-de-uso' },
];

export function SiteFooter({ onNavigate }: SiteFooterProps) {
  return (
    <footer className="w-full bg-slate-950 px-4 py-10 pb-28 text-slate-200 shadow-2xl sm:px-6 sm:pb-10 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <BrandLogo href="/" className="[&_p:last-child]:text-slate-400 [&_p]:text-white" />
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
                  className="inline-flex items-center gap-2 text-left transition hover:text-white"
                >
                  <item.icon className="size-4 text-primary" />
                  {item.label}
                </button>
              ) : (
                <span key={item.id} className="inline-flex items-center gap-2">
                  <item.icon className="size-4 text-primary" />
                  {item.label}
                </span>
              ),
            )}
          </div>
          <div className="mt-6 border-t border-slate-800 pt-5">
            <h4 className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
              Legal
            </h4>
            <div className="mt-3 grid gap-2 text-sm text-slate-300">
              {legalItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-white">
            Endereco
          </h3>
          <div className="mt-4 flex items-start gap-3 text-sm leading-7 text-slate-300">
            <span className="mt-1 inline-flex size-9 items-center justify-center rounded-2xl bg-slate-900 text-primary">
              <MapPin className="size-4" />
            </span>
            <p>
              Praca Samuel Sabatini, 226 - Centro
              <br />
              Sao Bernardo do Campo/SP
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-white">
            Contato
          </h3>
          <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            <p className="flex items-center gap-3">
              <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-slate-900 text-primary">
                <MessageCircle className="size-4" />
              </span>
              (11) 91675-1213
            </p>
            <p className="flex items-center gap-3">
              <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-slate-900 text-primary">
                <Mail className="size-4" />
              </span>
              contato@nexoleiloes.com.br
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-slate-200">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2">
              <Instagram className="size-4 text-primary" />
              Instagram
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2">
              <PlayCircle className="size-4 text-primary" />
              Youtube
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2">
              <Linkedin className="size-4 text-primary" />
              Linkedin
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
