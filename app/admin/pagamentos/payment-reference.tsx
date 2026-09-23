'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function PaymentReference({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={value}
      className="mt-2 flex max-w-[8.5rem] items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-left text-[11px] font-semibold text-slate-500 transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
    >
      <span className="min-w-0 flex-1 truncate">{formatReference(value)}</span>
      {copied ? <Check className="size-3 shrink-0" /> : <Copy className="size-3 shrink-0" />}
    </button>
  );
}

function formatReference(value: string) {
  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 8)}...`;
}
