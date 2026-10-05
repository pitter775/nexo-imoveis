// Retorna apenas nomes e presenca das variaveis; nunca retorna seus valores.
export function subscriptionConfiguration(env: Record<string, string | undefined>) {
  const groups = [
    { label: 'Contratação', keys: ['MERCADO_PAGO_ACCESS_TOKEN'], required: true },
    { label: 'Confirmação por webhook', keys: ['MERCADO_PAGO_WEBHOOK_SECRET'], required: true },
    { label: 'Troca de cartão', keys: ['NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY'], required: false },
    { label: 'Conciliação diária', keys: ['CRON_SECRET'], required: false },
    { label: 'Avisos por e-mail', keys: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'], required: false },
  ];
  return groups.map(group => ({ ...group, missing: group.keys.filter(key => !configured(env[key])) }));
}

function configured(value: string | undefined) {
  return Boolean(value?.trim() && !/^(YOUR_|CHANGE_ME|MY_APP_URL)/i.test(value.trim()));
}

export function assertSubscriptionCheckoutConfigured(env: Record<string, string | undefined>) {
  const missing = subscriptionConfiguration(env).filter(item => item.required).flatMap(item => item.missing);
  if (missing.length) throw new Error(`Configuração de assinatura incompleta: ${missing.join(', ')}.`);
}
