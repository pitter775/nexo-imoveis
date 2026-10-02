'use client';

import Script from 'next/script';
import { useEffect, useId, useRef, useState } from 'react';
import { manageOwnSubscription, type SubscriptionActionResult } from '@/lib/payments/subscription-actions';

type Controller = { unmount: () => Promise<void> };
type MercadoPagoConstructor = new (key: string, options: { locale: string }) => {
  bricks: () => { create: (type: string, container: string, options: Record<string, unknown>) => Promise<Controller> };
};

export function SubscriptionCardForm({ id, amount, email, publicKey, onResult }: {
  id: string; amount: number; email: string; publicKey: string;
  onResult: (result: SubscriptionActionResult) => void;
}) {
  const container = `subscription-card-${useId().replace(/:/g, '')}`;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const callback = useRef(onResult);
  callback.current = onResult;
  useEffect(() => {
    if (!ready) return;
    let disposed = false;
    let controller: Controller | undefined;
    const sdk = (window as Window & { MercadoPago?: MercadoPagoConstructor }).MercadoPago;
    if (!sdk) { setError(true); return; }
    new sdk(publicKey, { locale: 'pt-BR' }).bricks().create('cardPayment', container, {
      initialization: { amount, payer: { email } },
      customization: { visual: { texts: { formTitle: 'Atualizar cartão', payButton: 'Salvar cartão' } }, paymentMethods: { minInstallments: 1, maxInstallments: 1 } },
      callbacks: {
        onReady: () => {}, onError: () => setError(true),
        onSubmit: async (form: { token: string }) => {
          const result = await manageOwnSubscription(id, 'card', form.token);
          callback.current(result);
          if (!result.ok) throw new Error(result.message);
        },
      },
    }).then(value => { if (disposed) void value.unmount(); else controller = value; }).catch(() => setError(true));
    return () => { disposed = true; void controller?.unmount(); };
  }, [ready, id, amount, email, publicKey, container]);
  return <div className="rounded-2xl border border-slate-200 bg-white p-5">
    <p className="mb-4 text-sm text-slate-600">Cadastre o cartão para as próximas mensalidades. Os dados são processados pelo Mercado Pago.</p>
    <Script src="https://sdk.mercadopago.com/js/v2" onReady={() => setReady(true)} onError={() => setError(true)} />
    {error && <p role="alert" className="text-sm text-rose-700">Não foi possível carregar o formulário seguro. Tente novamente.</p>}
    {!ready && !error && <p className="text-sm text-slate-500">Carregando formulário seguro…</p>}
    <div id={container} />
  </div>;
}
