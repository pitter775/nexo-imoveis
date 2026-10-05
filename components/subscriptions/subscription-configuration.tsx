import 'server-only';
import { subscriptionConfiguration } from '@/lib/payments/subscription-configuration';

// Renderizar apenas em rotas protegidas por requireAdmin().
export function SubscriptionConfiguration() {
  const checks = subscriptionConfiguration(process.env);
  return <details className="rounded-2xl border border-slate-200 bg-white p-5">
    <summary className="cursor-pointer font-semibold">Configuração da integração · {checks.some(check => check.missing.length) ? 'há itens pendentes' : 'variáveis presentes'}</summary>
    <p className="mt-3 text-sm text-slate-500">Verifica a presença das configurações neste deploy. Não valida as chaves nem confirma pagamentos.</p>
    <ul className="mt-4 space-y-3 text-sm">{checks.map(check => <li key={check.label}>
      <span className="font-semibold">{check.label}: </span>{check.missing.length ? `falta ${check.missing.join(', ')}` : 'configurado'}
    </li>)}</ul>
    <p className="mt-4 text-sm text-slate-500">A conciliação roda uma vez por dia. Os webhooks atualizam os pagamentos quando o Mercado Pago envia a confirmação.</p>
  </details>;
}
