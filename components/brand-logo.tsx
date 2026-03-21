'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

type BrandLogoProps = {
  href?: string;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
};

export function BrandLogo({
  href,
  onClick,
  className = '',
  compact = false,
}: BrandLogoProps) {
  const content = (
    <>
      <div
        className={`rounded-xl bg-primary text-white shadow-lg shadow-primary/20 ${
          compact ? 'p-2' : 'p-2.5'
        }`}
      >
        <Home className={compact ? 'size-4' : 'size-5'} />
      </div>
      <div className="min-w-0">
        <p
          className={`font-bold tracking-tight text-slate-900 ${
            compact ? 'text-lg' : 'text-xl'
          }`}
        >
          Nexo Leiloes
        </p>
        {!compact ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Leiloes Imobiliarios
          </p>
        ) : null}
      </div>
    </>
  );

  const sharedClassName = [
    'inline-flex items-center gap-3 transition-opacity hover:opacity-90',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={sharedClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={sharedClassName}>
      {content}
    </button>
  );
}
