# Ativar e testar assinaturas NEXO

Atualizado em 05/10/2026. Plano temporario: R$ 1,00/mes, com aviso de testes.
O fluxo novo esta ativo no codigo. Nao existe flag para configurar na Vercel.
Os dois SQL de 01/10 ja foram aplicados pelo responsavel; esta entrega nao exige SQL novo.

## 1. Credenciais na mesma aplicacao Mercado Pago

Acesse https://www.mercadopago.com.br/developers/panel, entre na aplicacao da NEXO e abra
Producao > Credenciais de producao. Reutilize as chaves existentes da mesma aplicacao;
nao e necessario criar outra aplicacao ou renovar chaves que ja funcionam.

Copie Access Token e Public Key para o ambiente Production da Vercel, sem enviar os valores no chat.
Na mesma aplicacao, abra Webhooks > Configurar notificacoes, escolha producao e use:

```
https://www.nexoleiloes.com.br/api/pagamentos/mercado-pago/webhook
```

Selecione Pagamentos e Planos e assinaturas (eventos `payment`, `subscription_preapproval`,
`subscription_authorized_payment`). Revele a assinatura secreta existente e copie-a.
Ela e diferente de Client Secret. Manter a URL existente se ja for exatamente esta.

## 2. Variaveis na Vercel

Projeto NEXO > Settings > Environment Variables > Production:

| Nome | Valor / origem | Finalidade |
| --- | --- | --- |
| `MERCADO_PAGO_ACCESS_TOKEN` | Access Token de producao | Criar e consultar assinaturas |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Assinatura secreta de Webhooks | Confirmar origem das notificacoes |
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | Public Key da mesma aplicacao | Formulario de troca do cartao |
| `APP_URL` | `https://www.nexoleiloes.com.br` | Retorno do checkout |
| `CRON_SECRET` | Segredo aleatorio gerado por voce, diferente das chaves MP | Conciliacao automatica |

Para gerar `CRON_SECRET` no terminal local, execute:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Guarde a saida diretamente na Vercel. O cron nativo envia esse segredo automaticamente.
O agendamento e diario (`0 9 * * *`, UTC), compativel com Hobby. Webhooks continuam sendo
o mecanismo principal de atualizacao. A conciliacao atende ate 10 assinaturas por execucao;
revisar frequencia/capacidade antes de ampliar a operacao. Durante o teste, Minha Assinatura
tem o botao de atualizacao manual para consultar o provedor sem esperar o cron.

Para e-mails, configurar tambem `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e
`SMTP_FROM` com o provedor de e-mail. SMTP nao impede criar/pagar assinatura, mas os avisos
ficarao pendentes e o cron indicara falha de envio enquanto nao estiver configurado.

Salvar e fazer Redeploy do commit mais recente. A alteracao de variaveis so vale em um novo deploy.
Em Admin > Assinaturas > Configuracao da integracao, conferir presenca das variaveis.
O painel nao revela segredos e nao comprova se uma chave esta valida.

## 3. Teste real de R$ 1,00

1. Entrar na NEXO com usuario comum interno (nao administrador, que ja tem acesso gratuito).
2. Abrir um imovel > Solicitar informacoes > Plano mensal. Confirmar R$ 1,00 antes de pagar.
3. Usar pagador real distinto da conta recebedora e cartao real para a cobranca de producao;
   nao misturar credenciais/cartoes ficticios de sandbox com este teste real.
4. Apos concluir, conferir Minha Assinatura e Admin > Assinaturas: fatura paga, valor R$ 1,00,
   periodo de acesso e proxima cobranca. Autorizacao sem pagamento nao deve liberar acesso.
5. Se continuar pendente, clicar em Atualizar situacao e conferir as entregas do webhook no MP.
6. Testar abertura dos detalhes/chat de outro imovel e cancelar a assinatura de teste pelo painel
   do cliente; conferir que o cancelamento aparece no MP e preserva o periodo efetivamente pago.

Cancelar impede renovacoes futuras; nao realiza estorno. Restaurar o preco do codigo para
R$ 119 depois nao altera automaticamente as assinaturas de R$ 1 ja criadas no Mercado Pago.
Nao considerar renovacao, estorno ou recuperacao de falha aprovados sem testa-los separadamente.

## Limites da entrega

- Pix Automatico nao esta confirmado nem implementado; a assinatura atual usa o fluxo existente
  de preapproval. A tela Pix QR/copia e cola embutida ainda e trabalho pendente.
- Testes locais validam regras e assinaturas criptograficas, nao substituem o ciclo real de pagamento.
- Timeout na criacao preserva reserva para conciliacao; nao apagar a reserva nem criar outra cobranca
  sem conferir a primeira no MP. Rejeicoes explicitas 400/401/403/422 permitem nova tentativa.
- Registros antigos sem vinculo com o provedor podem precisar de conferencia individual.

## Referencias oficiais verificadas

- https://www.mercadopago.com.br/developers/pt/docs/your-integrations/credentials
- https://www.mercadopago.com.br/developers/pt/docs/subscriptions/additional-content/your-integrations/notifications/webhooks
- https://vercel.com/docs/environment-variables
- https://vercel.com/docs/cron-jobs/usage-and-pricing
- https://vercel.com/docs/cron-jobs/manage-cron-jobs
