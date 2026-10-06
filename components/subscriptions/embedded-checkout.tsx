'use client';

import Script from 'next/script';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Copy, LoaderCircle, ShieldCheck } from 'lucide-react';

type CheckoutResult = { id?: string; approved?: boolean; status?: string; expiresAt?: string; pix?: { code: string; image: string } | null };
type CheckoutConfig = { publicKey: string; email: string; userId: string; amount: number };
type BrickController = { unmount: () => Promise<void> };
type MercadoPagoConstructor = new (key: string, options: { locale: string }) => {
  bricks: () => { create: (type: string, container: string, options: Record<string, unknown>) => Promise<BrickController> };
};

export function EmbeddedCheckout({ plan, propertyId, onBack, onApproved }: {
  plan: 'mensal' | 'imovel'; propertyId: string; onBack: () => void; onApproved: () => void;
}) {
  const container = `nexo-checkout-${useId().replace(/[^a-z0-9]/gi, '')}`;
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [management, setManagement] = useState(false);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [revision, setRevision] = useState(0);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const attempt = useRef('');
  const submitting = useRef(false);
  const approved = useRef(false);
  const callback = useRef(onApproved);
  callback.current = onApproved;
  const monthly = plan === 'mensal';
  const storageKey = config ? `nexo-checkout:${config.userId}:${propertyId}:${plan}` : '';

  useEffect(() => {
    let disposed = false;
    setError(null);
    fetch(`/api/pagamentos/checkout?plano=${plan}`, { cache: 'no-store', signal: AbortSignal.timeout(20000) })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Não foi possível carregar o pagamento.');
        if (disposed) return;
        const key = `nexo-checkout:${data.userId}:${propertyId}:${plan}`;
        attempt.current = crypto.randomUUID();
        try {
          const saved = JSON.parse(sessionStorage.getItem(key) ?? 'null');
          if (saved?.attempt) attempt.current = saved.attempt;
          if (saved?.id) setResult({ id: saved.id, status: 'pending' });
        } catch { /* Armazenamento indisponivel nao impede o formulario. */ }
        setConfig(data);
      }).catch(failure => { if (!disposed) setError(failure.message || 'Não foi possível carregar o pagamento.'); });
    return () => { disposed = true; };
  }, [plan, propertyId, revision]);

  useEffect(() => {
    if (!config || !sdkReady || result) return;
    let disposed = false;
    let controller: BrickController | undefined;
    const sdk = (window as Window & { MercadoPago?: MercadoPagoConstructor }).MercadoPago;
    if (!sdk) { setError('Não foi possível carregar o formulário seguro.'); return; }
    setFormReady(false);
    const onSubmit = async (value: Record<string, unknown>) => {
      if (submitting.current) throw new Error('Pagamento em processamento.');
      submitting.current = true;
      setBusy(true); setError(null); setManagement(false);
      try {
        try { sessionStorage.setItem(storageKey, JSON.stringify({ attempt: attempt.current })); } catch {}
        const response = await fetch('/api/pagamentos/checkout', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(50000),
          body: JSON.stringify({ plano: plan, imovelId: propertyId, attempt: attempt.current, formData: monthly ? value : value.formData }),
        });
        const data = await response.json();
        if (!response.ok) {
          setManagement(data.managementUrl === '/dashboard/assinatura');
          throw new Error(data.error || 'Não foi possível confirmar o pagamento.');
        }
        if (data.id) {
          try { sessionStorage.setItem(storageKey, JSON.stringify({ attempt: attempt.current, id: data.id })); } catch {}
        }
        setResult(data);
      } catch (failure) {
        const message = failure instanceof Error && failure.name !== 'TimeoutError' ? failure.message
          : 'A confirmação demorou mais que o esperado. Tente novamente nesta tela para consultar a mesma tentativa.';
        setError(message);
        throw new Error(message);
      } finally { submitting.current = false; setBusy(false); }
    };
    new sdk(config.publicKey, { locale: 'pt-BR' }).bricks().create(monthly ? 'cardPayment' : 'payment', container, {
      initialization: { amount: config.amount, payer: { email: config.email } },
      customization: {
        paymentMethods: monthly ? { minInstallments: 1, maxInstallments: 1 } : { creditCard: 'all', bankTransfer: 'all', maxInstallments: 1 },
        visual: { style: { theme: 'default' } },
      },
      callbacks: {
        onReady: () => { if (!disposed) setFormReady(true); },
        onError: () => { if (!disposed) setError('Confira os campos do formulário. Se ele não carregar, atualize a página.'); },
        onSubmit,
      },
    }).then(value => { if (disposed) void value.unmount(); else controller = value; })
      .catch(() => { if (!disposed) setError('Não foi possível abrir o formulário seguro. Atualize a página e tente novamente.'); });
    return () => { disposed = true; void controller?.unmount(); };
  }, [config, sdkReady, result, container, monthly, plan, propertyId, storageKey]);

  async function refresh() {
    if (!result?.id || busy) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/pagamentos/checkout?plano=${plan}&id=${encodeURIComponent(result.id)}`, { cache: 'no-store', signal: AbortSignal.timeout(50000) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível consultar o pagamento.');
      setResult(data);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Tente atualizar a situação novamente.'); }
    finally { setBusy(false); }
  }
  const refreshCallback = useRef(refresh);
  refreshCallback.current = refresh;
  useEffect(() => {
    if (!result?.id || result.approved || ['cancelled', 'cancelada', 'rejected', 'refunded'].includes(result.status ?? '')) return;
    let calls = 0;
    const timer = setInterval(() => {
      if (++calls > 30) { clearInterval(timer); return; }
      void refreshCallback.current();
    }, 10000);
    return () => clearInterval(timer);
  }, [result?.id, result?.approved, result?.status]);
  useEffect(() => {
    if (!result?.approved || approved.current) return;
    approved.current = true;
    try { sessionStorage.removeItem(storageKey); } catch {}
    callback.current();
  }, [result?.approved, storageKey]);
  useEffect(() => {
    if (!result?.pix) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [Boolean(result?.pix)]);

  const seconds = result?.expiresAt ? Math.max(0, Math.ceil((Date.parse(result.expiresAt) - now) / 1000)) : null;
  const rejected = ['rejected', 'cancelled', 'cancelada', 'refunded'].includes(result?.status ?? '');
  const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold disabled:opacity-50';
  return <section className="space-y-5 p-5 sm:p-7" aria-label="Pagamento na NEXO">
    <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-primary disabled:opacity-50" onClick={onBack} disabled={busy}><ArrowLeft className="size-4" /> Voltar aos planos</button>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-5">
      <div><h4 className="text-lg font-extrabold">{monthly ? 'Plano mensal · em testes' : 'Acesso a este imóvel'}</h4>
        <p className="mt-1 text-sm text-slate-600">{monthly ? 'Cobrança recorrente no cartão. Cancele em Minha Assinatura.' : 'Pagamento único por Pix ou cartão, sem assinatura.'}</p></div>
      {config && <p className="text-2xl font-black text-primary">{config.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}{monthly && <span className="text-sm">/mês</span>}</p>}
    </div>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}
      {management && <Link className="mt-3 block font-bold underline" href="/dashboard/assinatura">Abrir Minha Assinatura</Link>}
      {!config && <button type="button" className="mt-3 block font-bold underline" onClick={() => setRevision(value => value + 1)}>Tentar carregar novamente</button>}
    </div>}
    {!result ? <>
      {(!config || !formReady) && !error && <p role="status" className="flex items-center gap-2 text-sm text-slate-600"><LoaderCircle className="size-4 animate-spin" /> Carregando formulário seguro…</p>}
      <Script src="https://sdk.mercadopago.com/js/v2" onReady={() => setSdkReady(true)} onError={() => setError('Não foi possível carregar o Mercado Pago. Confira sua conexão e atualize a página.')} />
      <div id={container} />
      {busy && <p role="status" className="text-sm font-semibold text-primary">Confirmando pagamento. Aguarde nesta tela…</p>}
    </> : <div className="space-y-4 rounded-2xl border border-slate-200 p-5">
      <h4 className="text-xl font-extrabold">{result.approved ? 'Pagamento confirmado' : rejected ? 'Pagamento não concluído' : result.pix ? 'Pix gerado' : 'Aguardando confirmação do pagamento'}</h4>
      {result.pix && <>
        <p className="text-sm text-slate-600">Escaneie o QR Code no aplicativo do seu banco ou use Pix Copia e Cola.</p>
        {seconds === 0 ? <p role="status" className="text-sm text-amber-800">Prazo deste Pix encerrado. Atualize a situação para conferir se houve pagamento.</p> : <>
          {result.pix.image && <img src={`data:image/png;base64,${result.pix.image}`} alt="QR Code para pagamento Pix" className="mx-auto size-56 max-w-full" />}
          {seconds !== null && Number.isFinite(seconds) && <p className="text-center text-sm font-semibold">Válido por {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</p>}
          <label className="block text-sm font-semibold">Pix Copia e Cola<input className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-xs" readOnly value={result.pix.code} onFocus={event => event.target.select()} /></label>
          <button type="button" className={button} disabled={!result.pix.code} onClick={async () => {
            try { await navigator.clipboard.writeText(result.pix!.code); setCopied(true); }
            catch { setError('Selecione o código acima e copie manualmente.'); }
          }}><Copy className="size-4" />{copied ? 'Código copiado' : 'Copiar código Pix'}</button>
        </>}
      </>}
      {!result.approved && <p className="text-sm text-slate-600">{rejected ? 'Nenhum acesso foi liberado por esta tentativa. Confira os dados e tente novamente.' : 'O acesso será liberado após a confirmação. Você pode manter esta tela aberta para acompanhar.'}</p>}
      <button type="button" className={button} disabled={busy} onClick={() => void refresh()}>{busy ? 'Consultando…' : 'Atualizar situação'}</button>
      {rejected && !monthly && <button type="button" className={`${button} ml-2`} onClick={() => {
        attempt.current = crypto.randomUUID();
        try { sessionStorage.removeItem(storageKey); } catch {}
        setResult(null); setError(null); setFormReady(false);
      }}>Tentar outro pagamento</button>}
      {monthly && <Link className="block text-sm font-bold text-primary underline" href="/dashboard/assinatura">Acompanhar em Minha Assinatura</Link>}
    </div>}
    <p className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="size-4" /> Dados do cartão processados pelo Mercado Pago. Pagamento dentro da NEXO.</p>
  </section>;
}
