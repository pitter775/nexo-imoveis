'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, LoaderCircle, RefreshCw, XCircle } from 'lucide-react';
import { manageOwnSubscription, manageSubscriptionAccess, grantSubscriptionCourtesy, type SubscriptionActionResult } from '@/lib/payments/subscription-actions';
import { SubscriptionCardForm } from './subscription-card-form';

const buttonStyle = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50';

export function CourtesyForm() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<SubscriptionActionResult | null>(null);
  return <details className="rounded-2xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer text-sm font-bold text-primary">Conceder acesso de cortesia a um cliente</summary>
    <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={event => {
      event.preventDefault(); const data = new FormData(event.currentTarget);
      start(async () => { try { setResult(await grantSubscriptionCourtesy(data)); } catch { setResult({ ok: false, message: 'Não foi possível salvar.' }); } });
    }}>
      <label className="text-sm font-semibold">E-mail cadastrado<input required name="email" type="email" className="mt-2 w-full rounded-xl border border-slate-200 p-3" /></label>
      <label className="text-sm font-semibold">Validade em dias<input required name="dias" type="number" min="1" max="365" defaultValue="30" className="mt-2 w-full rounded-xl border border-slate-200 p-3" /></label>
      <label className="text-sm font-semibold sm:col-span-2">Motivo<input required name="motivo" minLength={5} maxLength={1000} className="mt-2 w-full rounded-xl border border-slate-200 p-3" /></label>
      <div><button className={buttonStyle} disabled={pending}>Conceder cortesia</button></div>
      {result && <p role="status" className="text-sm sm:col-span-2">{result.message}</p>}
    </form>
  </details>;
}

export function SubscriptionControls({ id, cancelled, amount, email, publicKey }: {
  id: string; cancelled: boolean; amount: number; email: string; publicKey: string;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<SubscriptionActionResult | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const router = useRouter();
  function run(action: 'cancel' | 'refresh') {
    start(async () => {
      try {
        const response = await manageOwnSubscription(id, action);
        setResult(response);
        if (response.ok) { setConfirmCancel(false); router.refresh(); }
      } catch { setResult({ ok: false, message: 'Não foi possível conectar. Tente novamente.' }); }
    });
  }
  return <section className="space-y-4">
    <div className="flex flex-wrap gap-3">
      <button disabled={pending} onClick={() => run('refresh')} className={buttonStyle}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Atualizar situação</button>
      {!cancelled && <>
        <button disabled={pending || !publicKey} onClick={() => setShowCard(value => !value)} className={buttonStyle}><CreditCard className="size-4" /> Alterar forma de pagamento</button>
        <button disabled={pending} onClick={() => setConfirmCancel(true)} className={buttonStyle}><XCircle className="size-4" /> Cancelar assinatura</button>
      </>}
    </div>
    {confirmCancel && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
      <h3 className="font-bold text-rose-950">Cancelar a renovação mensal?</h3>
      <p className="mt-2 text-sm text-rose-900">As próximas cobranças serão interrompidas. Você mantém o período já pago.</p>
      <div className="mt-4 flex flex-wrap gap-3"><button disabled={pending} className={buttonStyle} onClick={() => run('cancel')}>Confirmar cancelamento</button>
        <button disabled={pending} className={buttonStyle} onClick={() => setConfirmCancel(false)}>Manter assinatura</button></div>
    </div>}
    {showCard && publicKey && <SubscriptionCardForm id={id} amount={amount} email={email} publicKey={publicKey} onResult={setResult} />}
    {result && <p role="status" className={`rounded-xl p-4 text-sm ${result.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{result.message}</p>}
  </section>;
}

export function AdminAccessControls({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [action, setAction] = useState('conceder');
  const [result, setResult] = useState<SubscriptionActionResult | null>(null);
  return <form className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6" onSubmit={event => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    start(async () => {
      try { setResult(await manageSubscriptionAccess(data)); }
      catch { setResult({ ok: false, message: 'Não foi possível salvar a alteração.' }); }
    });
  }}>
    <h2 className="text-xl font-bold">Controle manual de acesso</h2>
    <p className="text-sm leading-6 text-slate-600">Estas ações afetam o acesso mensal. Não cancelam cobranças nem alteram compras avulsas. Reativar remove a exceção e volta a exigir período pago; para acesso gratuito, conceda cortesia.</p>
    <input type="hidden" name="id" value={id} />
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold">Ação<select name="acao" value={action} onChange={event => setAction(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3">
        <option value="conceder">Conceder cortesia</option><option value="suspender">Suspender acesso mensal</option><option value="reativar">Reativar conforme pagamento</option>
      </select></label>
      {action === 'conceder' && <label className="text-sm font-semibold">Validade em dias<input name="dias" type="number" min="1" max="365" defaultValue="30" required className="mt-2 w-full rounded-xl border border-slate-200 p-3" /></label>}
    </div>
    <label className="block text-sm font-semibold">Motivo<textarea name="motivo" required minLength={5} maxLength={1000} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 p-3" placeholder="Descreva o motivo para registro na auditoria" /></label>
    {action === 'suspender' && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">A cobrança mensal continuará no Mercado Pago. Esta ação suspende somente o acesso mensal à NEXO.</p>}
    <button disabled={pending} className={buttonStyle}>{pending && <LoaderCircle className="size-4 animate-spin" />} Registrar alteração</button>
    {result && <p role="status" className={`text-sm ${result.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{result.message}</p>}
  </form>;
}
