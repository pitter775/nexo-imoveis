# AGENTS.md

## Objetivo deste arquivo

Este arquivo existe para alinhar o trabalho entre o projeto, eu e você.
Ele resume o sistema, aponta as fontes de verdade e registra o jeito mais seguro de executar tarefas sem perder tempo tentando caminhos que hoje nao funcionam bem.

## Resumo do projeto

- Nome do projeto: `nexo-imoveis`
- Stack principal: `Next.js 16`, `React 19`, `TypeScript`, `Tailwind CSS`, `Supabase`
- Existe codigo legado com `better-sqlite3`, mas a modelagem atual importante do sistema esta no `Supabase`
- O projeto e focado em imoveis/leiloes, com area publica, area admin, autenticacao, arquivos, imagens e dados detalhados dos imoveis

## Estrutura principal

- `app/`: rotas e paginas do Next.js
- `components/`: componentes visuais e formularios
- `lib/`: regras de negocio, auth, integracoes e acesso a dados
- `database/schema.sql`: referencia atual da estrutura do banco no Supabase
- `database/seeds/`: local correto para criar arquivos de alteracao de banco
- `docs/`: documentacao complementar
- `public/`: arquivos estaticos

## Fonte de verdade do banco

### Regra mais importante

O arquivo [database/schema.sql](/C:/Projetos/nexo/nexo-imoveis/database/schema.sql) **nao pode ser editado diretamente**.

Alteracoes no banco devem ser executadas por voce.
Eu posso consultar livremente a estrutura, ler o `schema.sql`, analisar queries, criar o script SQL dentro de `database/seeds` e orientar a mudanca, mas a aplicacao da alteracao no Supabase fica com voce.

Se houver qualquer necessidade de alteracao no banco:

1. Criar um novo arquivo SQL em [database/seeds](/C:/Projetos/nexo/nexo-imoveis/database/seeds)
2. Eu preparo esse arquivo SQL em `database/seeds`
3. Voce aplica esse script no Supabase
4. So depois atualizar o [database/schema.sql](/C:/Projetos/nexo/nexo-imoveis/database/schema.sql) para refletir o estado real do banco

### Fluxo correto para mudancas de banco

- Nunca sair editando `schema.sql` como se fosse migration
- Sempre criar um arquivo novo em `database/seeds`
- Eu devo escrever e preparar esse arquivo SQL para voce em `database/seeds`
- A execucao da alteracao no banco fica com voce
- O `schema.sql` deve espelhar o banco real, nao antecipar mudancas
- Se existir divergencia entre codigo e banco, validar primeiro no Supabase

### Observacao importante

O arquivo [docs/database.md](/C:/Projetos/nexo/nexo-imoveis/docs/database.md) ajuda como documentacao conceitual, mas hoje ele parece estar parcialmente desatualizado em relacao ao [database/schema.sql](/C:/Projetos/nexo/nexo-imoveis/database/schema.sql).

Quando houver conflito:

- confiar primeiro em `database/schema.sql`
- depois conferir o uso real nas queries do `lib/`
- usar `docs/database.md` como apoio, nao como fonte final

## O que funciona hoje

- O acesso principal a dados do sistema atual passa pelo `Supabase`
- Arquivos como [lib/supabase.ts](/C:/Projetos/nexo/nexo-imoveis/lib/supabase.ts), [lib/supabase/admin.ts](/C:/Projetos/nexo/nexo-imoveis/lib/supabase/admin.ts) e [lib/admin/imoveis.ts](/C:/Projetos/nexo/nexo-imoveis/lib/admin/imoveis.ts) mostram esse caminho
- O admin usa fortemente tabelas como `imoveis`, `imovel_imagens`, `imovel_arquivos`, `imovel_detalhes`, `chat_conversas` e `chat_mensagens`
- O projeto roda localmente com `npm run dev`
- O ambiente depende de variaveis em `.env.local`, especialmente as do Supabase e segredos da aplicacao
- Para explorar, editar e validar tarefas, o caminho com mais sucesso costuma ser usando `PowerShell`

## O que nao deve ser assumido como principal

- [lib/db.ts](/C:/Projetos/nexo/nexo-imoveis/lib/db.ts) usa `better-sqlite3` e parece legado ou paralelo ao fluxo principal
- O arquivo `database.sqlite` existe, mas nao deve ser tratado como fonte de verdade do banco atual
- O `README.md` atual esta generico e nao descreve bem o estado real do projeto
- A pasta [database/seeds](/C:/Projetos/nexo/nexo-imoveis/database/seeds) esta vazia neste momento, entao novas alteracoes precisam comecar por ela

## Regra operacional para evitar retrabalho

Se uma tarefa envolver banco, auth, admin, upload, imagens ou dados dos imoveis:

- assumir primeiro que a resposta esta no `Supabase`
- eu tenho liberdade para consultar a estrutura e o codigo relacionado ao banco
- conferir `schema.sql`
- conferir o uso real em `lib/admin/*`, `lib/auth/*` e `lib/supabase/*`
- evitar tomar decisoes com base apenas em `SQLite`, `README` antigo ou documentacao parcial

## Melhor forma de eu executar tarefas neste projeto

### Abordagem preferida

1. Ler a estrutura do repositorio
2. Confirmar a fonte de verdade envolvida
3. Fazer alteracoes pequenas e objetivas
4. Validar com comandos no `PowerShell`
5. Quando houver mudanca de banco, criar SQL em `database/seeds`

### Ferramentas e comandos que costumam funcionar melhor

- listar arquivos:
  - `Get-ChildItem -Force`
  - `Get-ChildItem -Recurse`
- buscar texto no projeto:
  - `rg "texto" app components lib database docs`
- abrir conteudo de arquivo:
  - `Get-Content caminho\\arquivo`
- rodar projeto:
  - `npm run dev`
- build:
  - `npm run build`
- checar scripts disponiveis:
  - `Get-Content package.json`

### Quando priorizar PowerShell

Se alguma tentativa por outro caminho ficar pouco confiavel, truncada ou inconsistente, priorizar `PowerShell`.
Hoje ele e o caminho mais seguro para:

- inspecionar estrutura
- localizar arquivos
- ler arquivos longos
- rodar comandos do projeto
- validar resultados

## Atalhos mentais para futuras tarefas

- Banco: `database/schema.sql` e `database/seeds/`
- Queries reais: `lib/admin/`, `lib/auth/`, `lib/supabase/`
- Interface e rotas: `app/` e `components/`
- Configuracao e segredos esperados: `.env.example` e `.env.local`
- Suspeita de codigo legado: `lib/db.ts` e `database.sqlite`

## Regras de seguranca para manutencao

- nao editar `database/schema.sql` diretamente
- eu posso consultar livremente a estrutura do banco e os pontos de integracao
- eu posso criar o script SQL em `database/seeds` para sua execucao
- quem aplica mudancas no Supabase e voce
- nao assumir que `docs/database.md` esta 100% atualizado
- nao assumir que `lib/db.ts` representa o banco atual do sistema
- antes de mudar tabela, coluna ou relacionamento, criar arquivo novo em `database/seeds`
- depois da atualizacao no Supabase, sincronizar o `schema.sql`

## Contexto rapido das tecnologias

- Frontend: `Next.js` com `React`
- Estilo: `Tailwind CSS`
- Backend do app: rotas/server code no proprio Next
- Banco principal atual: `Supabase`
- Integracoes de IA: existem dependencias de `OpenAI` e `Google GenAI`
- Storage de arquivos e imagens: fluxo conectado ao `Supabase Storage`

## Combinado pratico

Se eu precisar fazer qualquer trabalho neste repositorio, o padrao deve ser:

- primeiro entender onde a feature vive
- depois confirmar se a referencia correta e `Supabase` ou codigo legado
- executar pelo `PowerShell` quando for a forma mais confiavel
- registrar mudancas de banco em `database/seeds`
- atualizar `schema.sql` apenas depois que o banco real estiver atualizado

## Roteiro de melhoria: assinaturas, Pix e controle de acesso

Registrado em 01/10/2026. Este roteiro descreve trabalho planejado; nao significa que as funcionalidades abaixo estejam implementadas ou homologadas. Atualizar os itens conforme forem executados, registrando validacoes e pendencias reais.

### Protocolo de continuidade entre chats/Codex

1. Antes de alterar codigo, ler este roteiro e o quadro de andamento abaixo; conferir `git status` e os arquivos alterados para preservar o trabalho em curso.
2. Executar as etapas na ordem das dependencias. Registrar uma etapa como em andamento antes de iniciar e atualizar seu resultado ao encerrar o bloco de trabalho.
3. Marcar `[x]` somente quando o item estiver implementado e validado. Arquivo criado, compilacao aprovada ou interface pronta nao comprovam integracao com o provedor nem alteracao aplicada no banco.
4. Antes de encerrar cada sessao, atualizar o ponto de retomada, arquivos envolvidos, verificacoes executadas e bloqueios. Nao deixar o proximo Codex depender do historico do chat.
5. Nao iniciar outra integracao nem alterar requisitos comerciais para contornar uma dependencia sem alinhar a opcao com o responsavel.

### Andamento e ponto de retomada — 01/10/2026

**Situacao geral: base tecnica implementada e compilada; o fluxo novo esta ativo diretamente no codigo para teste controlado, mas ainda depende das credenciais do Mercado Pago e de um pagamento real para validacao.**

Decisoes confirmadas pelo responsavel:

- O trabalho foi autorizado apos o recebimento da entrada do cliente contratante.
- O valor comercial definitivo continua sendo **R$ 119,00 por mes**, mas foi alterado temporariamente para **R$ 1,00** para teste controlado em producao, a pedido do responsavel. Restaurar apos a validacao.
- Os registros atuais sao testes; nao existem clientes finais reais utilizando a plataforma, conforme informado pelo responsavel. Isso nao autoriza apagar registros ou cancelar cobrancas de teste automaticamente.
- Usar este `AGENTS.md` como roteiro e registro de continuidade.
- Pix Automatico para recebimento pela API do Mercado Pago continua sem confirmacao tecnica. Nao afirmar disponibilidade nem apresentar Pix manual como equivalente.

| Etapa | Estado | Evidencia / pendencia |
| --- | --- | --- |
| Roteiro e pontos de extensao | Concluido | Passo a passo registrado neste arquivo antes das alteracoes de codigo |
| 1. Viabilidade Pix Automatico | Pendente | Falta documentacao especifica e validacao para a conta recebedora |
| 2. Regras comerciais | Parcial | Preco confirmado; regras de atraso, suspensao e reativacao ainda precisam ser fechadas |
| 3. Banco | Concluido no Supabase | Os dois seeds foram aplicados; RPC `metricas_assinaturas` respondeu 200 com metricas zeradas; `schema.sql` sincronizado |
| 4. Integracao e sincronizacao | Implementado, nao homologado | Faturas, conciliacao, webhooks, reserva de contratacao e cron foram conectados; faltam credenciais e eventos reais |
| 5. Checkout/Pix dentro da NEXO | Parcial | Checkout mensal protegido por reserva; tela Pix Bricks ainda nao implementada; Pix Automatico segue sem API confirmada |
| 6. Minha Assinatura | Implementado, nao homologado | Tela, historico, cancelamento e atualizacao de cartao criados; falta validar no provedor |
| 7. Administrativo e auditoria | Implementado, nao homologado | Listagem/filtros, detalhe, cortesia, suspensao/reativacao e auditoria criados |
| 8. Protecao e homologacao | Parcial | TypeScript e build passaram; faltam testes funcionais, webhook assinado, cron e verificacao visual |

Arquivos ja criados/alterados nesta frente:

- `database/seeds/20261001_subscription_management.sql`: aplicado no Supabase; campos adicionais, tabelas de cobrancas/auditoria/avisos, RLS e funcoes transacionais.
- `database/seeds/20261001_subscription_management_metrics_courtesy.sql`: aplicado no Supabase; metricas agregadas e concessao de cortesia auditada.
- `lib/payments/subscription-management-types.ts`: tipos da estrutura aplicada no Supabase, sincronizados com `database/schema.sql`.
- `lib/payments/subscription-management-db.ts`: cliente tipado; o modo novo esta temporariamente ativo por codigo para o teste de producao.
- `lib/payments/subscription-policy.ts`: calculo de periodo, situacao, acesso manual e labels, usado pelos fluxos novos.
- `lib/payments/subscription-management.ts`: consulta, sincronizacao de assinatura/fatura e conciliacao, usado pelo webhook e cron.
- `lib/payments/mercado-pago.ts`: tipos ampliados e helpers para consultar faturas, cancelar assinatura e alterar token de cartao; chamadas novas ainda nao homologadas.
- `.env.example`: credenciais e chaves externas; a ativacao do modo novo nao depende mais de variavel de ambiente durante este teste.
- `vercel.json`: agenda conciliacao a cada 15 minutos; exige `CRON_SECRET` no ambiente e a mesma credencial no scheduler.

Verificacoes desta sessao:

- `npm exec tsc --noEmit`: passou apos a criacao desses arquivos. Isso confirma apenas a verificacao estatica.
- `npm run build`: passou, incluindo as rotas de cliente, administrativo, webhook e conciliacao. Isso confirma compilacao e geracao das rotas, nao o ciclo financeiro real.
- Banco real consultado por OpenAPI e RPC; os dois SQL foram aplicados e `database/schema.sql` foi sincronizado.
- Nenhum pagamento real criado, nenhum cancelamento enviado ao Mercado Pago e nenhuma credencial alterada.
- Nenhum commit, push ou deploy realizado nesta frente.

**Proxima acao do Codex:** configurar as credenciais disponiveis no ambiente de producao e acompanhar um ciclo de teste de R$ 1,00. A compilacao nao prova a integracao financeira.

**Atualizacao desta retomada:** o adaptador do Mercado Pago passou a aplicar timeout de 15 segundos nas chamadas de criacao e consulta, evitando requisicoes penduradas. O roteiro detalhado foi marcado com os blocos de banco, sincronizacao, experiencia, area do cliente e administrativo ja implementados. `npm exec tsc --noEmit` e `npm run build` passaram novamente apos essa alteracao.

### Runbook para teste controlado em producao sem homologacao

Como o projeto nao possui ambiente de homologacao disponivel, o primeiro teste em producao deve ser feito com uma conta de teste criada no proprio Mercado Pago e um usuario interno. Nao usar um cliente real nessa primeira rodada.

1. Confirmar no ambiente de producao `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`, `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`, `CRON_SECRET` e `APP_URL`. Nunca registrar os valores neste arquivo.
2. Confirmar que os dois SQL foram aplicados no mesmo projeto Supabase usado pela aplicacao e que `metricas_assinaturas()` responde sem erro.
3. Configurar no painel do Mercado Pago a URL `https://DOMINIO/api/pagamentos/mercado-pago/webhook` para os eventos de assinatura e pagamento. O endpoint rejeita notificacoes sem assinatura valida.
4. Fazer deploy e confirmar que a aplicacao abre normalmente. O modo novo ja esta ativo por codigo neste periodo de teste.
5. Contratar com o usuario interno e guardar o `assinaturaId` retornado. Durante este teste o valor e R$ 1,00; restaurar R$ 119,00 ao terminar.
6. Conferir no Supabase a assinatura, a cobranca e o historico antes de liberar qualquer outro usuario. O acesso so deve existir quando houver periodo pago confirmado ou cortesia auditada.
7. Chamar o cron com `Authorization: Bearer CRON_SECRET` e confirmar resposta 200. Uma resposta 503 exige investigar antes de continuar.
8. Para rollback, restaurar o retorno de `subscriptionManagementEnabled()` e o preco comercial, depois fazer novo deploy. Nao apagar registros, nao cancelar cobrancas automaticamente e preservar o `assinaturaId` para conciliacao posterior.

Esse procedimento testa a integracao real sem afirmar que Pix Automatico esta disponivel. O primeiro teste deve usar o fluxo de cartao recorrente que a API atual do Mercado Pago oferece; Pix comum e Pix Automatico continuam sendo validacoes distintas.

Pendencias tecnicas conhecidas para a retomada:

1. Confirmar as regras de acesso. Os termos atuais em `lib/legal-content.ts` ja descrevem manutencao do periodo pago apos cancelamento; conferir consistencia com a decisao comercial final.
2. Revisar SQL e implementar testes significativos para duplicidade, concorrencia, estorno, virada do mes e precedencia de excecoes administrativas. A funcao de sincronizacao recalcula `pago_ate`; validar cobrancas futuras e periodos antes de usa-la como criterio de acesso.
3. Exigir confirmacao do pagamento real ao persistir uma fatura como paga; revisar o fallback de status de `invoice.payment` quando nao existir ID de pagamento consultavel.
4. Revisar concorrencia no compare-and-swap da assinatura e tratamento/repeticao quando a atualizacao nao afetar linhas. Validar payloads e estados de cancelamento/alteracao do cartao na API oficial.
5. Homologar a regra nova nos pontos integrados: `subscriptions.ts`, contratacao, retorno, webhook e resumo do cliente. Durante o teste, o modo novo esta ativo por codigo e usa as tabelas e RPCs novas.
6. Configurar e testar o cron `/api/cron/assinaturas` com `CRON_SECRET`, SMTP de avisos, assinatura de webhook e repeticao em falha.
7. Fazer revisao visual e funcional em celular/desktop e revisar protecao de arquivos/URLs publicas antes de publicar acesso premium.
8. Confirmar indicadores com dados de teste controlados, separando receita recebida, previsao e cortesia; restaurar o preco comercial depois do teste.

### Objetivo e base para reaproveitar

Oferecer contratacao mensal, pagamento dentro da experiencia NEXO, area Minha NEXO -> Minha Assinatura e gestao administrativa. O acesso deve acompanhar o periodo efetivamente pago, com excecoes manuais auditadas.

Antes de implementar, revisar a base existente:

- `lib/payments/mercado-pago.ts`: precos e integracao com o provedor.
- `lib/payments/subscriptions.ts`: sincronizacao e verificacao de acesso por assinatura.
- `lib/payments/information-access.ts`: pagamentos e acessos avulsos que devem continuar funcionando.
- `app/api/pagamentos/assinatura/route.ts`: inicio da contratacao mensal.
- `app/api/pagamentos/mercado-pago/webhook/route.ts`: notificacoes.
- `app/api/pagamentos/mercado-pago/assinatura/retorno/route.ts`: retorno da contratacao.
- `app/dashboard/page.tsx` e `lib/client/purchased-properties.ts`: area do cliente.
- `app/admin/pagamentos/page.tsx`, `lib/admin/pagamentos.ts` e `lib/admin/dashboard.ts`: financeiro e indicadores.
- `database/schema.sql` e `lib/supabase/types.ts`: estrutura de referencia e tipos; conferir o banco real antes de propor alteracoes.

### 1. Confirmar Pix Automatico para a conta recebedora

- [ ] Confirmar com documentacao tecnica oficial e, se necessario, suporte do Mercado Pago se a conta da NEXO pode RECEBER Pix Automatico via API.
- [ ] Obter endpoints completos, exemplos de requisicao/resposta, requisitos de habilitacao, ambiente de testes e eventos de autorizacao, cobranca e cancelamento.
- [ ] Validar criacao da autorizacao, consentimento no banco do pagador e uma cobranca vinculada a essa autorizacao no ambiente suportado pelo provedor.
- [ ] Registrar a evidencia e a decisao antes de implementar o fluxo de Pix Automatico.

Distincao obrigatoria: Pix com QR Code/copia e cola exige pagamento pelo cliente; gerar um novo Pix mensalmente nao e debito automatico. Checkout Bricks permite apresentar Pix na NEXO, mas isso nao comprova suporte a Pix Automatico. Um artigo sobre autorizar pagamentos no app Mercado Pago tambem nao comprova a disponibilidade da API para recebedores.

Na pesquisa desta demanda, nao foi confirmado um fluxo tecnico de Pix Automatico aplicavel a conta NEXO. Nao inventar endpoints, payloads ou reaproveitar `/preapproval` como autorizacao Pix sem documentacao especifica. Revalidar essa disponibilidade na implementacao.

Referencias para consulta, sem considera-las prova de suporte ao Pix Automatico:

- [Pix no Payment Brick](https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/payment-brick/payment-submission/pix)
- [Criar assinatura](https://www.mercadopago.com.br/developers/pt/reference/online-payments/subscriptions/create-preapproval/post)
- [Webhooks de assinaturas](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/additional-content/your-integrations/notifications/webhooks)

Se o recurso nao estiver disponivel, apresentar ao responsavel as opcoes: cartao recorrente com Pix manual como alternativa, ou outro provedor com Pix Automatico documentado. Nao substituir o requisito silenciosamente. As etapas independentes de gestao podem avancar enquanto essa validacao estiver pendente.

### 2. Fechar as regras comerciais e de acesso

- [x] Confirmar o valor comercial mensal: R$ 119,00. Para o teste atual, o codigo usa temporariamente R$ 1,00 e deve ser revertido depois.
- [ ] Manter o plano mensal com acesso a todos os imoveis e preservar a compra avulsa e o CTA Solicitar informacoes.
- [ ] Definir inicio e fim de cada periodo pago, proxima cobranca, tolerancia a atraso e tratamento de estorno/contestacao.
- [ ] Definir se o cancelamento preserva o acesso ate o fim do periodo pago e como funciona a reativacao.
- [ ] Definir os canais de aviso de falha e regularizacao; WhatsApp depende de integracao e escopo proprios.
- [ ] Definir precedencia e validade das excecoes administrativas: concessao, suspensao e reativacao. Suspender acesso nao deve cancelar ou manter cobrancas por acidente; essa regra precisa ser explicita.

Separar status da autorizacao, status da assinatura, status de cada cobranca e direito de acesso. Autorizacao `authorized` sozinha nao comprova que uma mensalidade foi paga. Uma tentativa recusada nao deve remover automaticamente um periodo anterior ainda pago, salvo regra comercial expressamente definida.

### 3. Preparar a estrutura no Supabase

- [x] Reaproveitar `assinaturas`, `pagamentos` e `user_access` onde fizer sentido, preservando os registros existentes.
- [x] Preparar SQL novo em `database/seeds` para os campos e relacionamentos faltantes: plano, provedor, metodo, referencia de autorizacao, ciclo pago, proxima cobranca e vinculo das cobrancas com a assinatura.
- [x] Prever historico de cobrancas com valor, vencimento, pagamento, status e identificador unico do provedor, incluindo tentativas quando necessario.
- [x] Prever controle de eventos processados e auditoria das acoes manuais, com administrador, cliente/assinatura, acao, motivo, estado anterior/novo, data e validade da excecao.
- [x] Definir constraints, indices e permissoes/RLS; um cliente so pode consultar e gerir a propria assinatura. Segredos do provedor ficam no servidor.
- [x] O responsavel pelo projeto aplicou os dois SQL no Supabase; o resultado foi conferido, `schema.sql` sincronizado e os tipos atualizados.

### 4. Implementar cobrancas e sincronizacao confiavel

- [x] Centralizar as regras em `lib/payments`, reutilizando autenticacao, clientes Supabase e integracao existentes.
- [x] Tratar notificacoes de assinatura e cobranca separadamente. Os eventos suportados pelo adaptador incluem `subscription_preapproval`, `subscription_authorized_payment` e `payment`.
- [x] Validar autenticidade dos webhooks e consultar o recurso no provedor, conferindo vinculo com cliente/assinatura, valor e moeda antes de conceder acesso.
- [x] Processar eventos repetidos com idempotencia e eventos fora de ordem sem regredir o estado com dados antigos.
- [x] Persistir a cobranca confirmada e atualizar o periodo de acesso de forma consistente; o retorno do navegador nao libera acesso sozinho.
- [x] Tratar falhas de processamento retornando erro para repeticao do provedor e registrar conciliacao para recuperacao posterior.
- [x] Implementar conciliacao periodica para recuperar notificacoes perdidas, evitando cobrancas e avisos duplicados.
- [x] Implementar cancelamento e alteracao do meio de pagamento conforme os endpoints usados pelo adaptador; falta homologar os payloads na conta real.
- [ ] Para Pix Automatico, agendar/emitir cobrancas apenas conforme o contrato da API validada. Para cartao, evitar duplicar a recorrencia ja gerida pelo provedor.

### 5. Criar a experiencia de contratacao e Pix na NEXO

- [x] Reaproveitar o seletor de planos e a identidade visual, preservando a jornada atual.
- [x] Mostrar plano, valor, periodicidade e condicoes antes da confirmacao; o valor exibido durante o teste e R$ 1,00.
- [ ] Para Pix manual, exibir resumo, QR Code, copia e cola, validade real e estados aguardando/pago/expirado/erro, com atualizacao consultada no servidor.
- [ ] Para Pix Automatico validado, orientar a autorizacao no banco e distinguir autorizacao concedida de primeiro pagamento confirmado.
- [x] Evitar assinaturas/cobrancas duplicadas por clique repetido e permitir retomar uma contratacao pendente.
- [ ] Validar celular e desktop, incluindo copia do codigo e retorno depois do aplicativo bancario. O print do cliente e referencia visual, nao prova do provedor ou de recorrencia.

### 6. Implementar Minha NEXO -> Minha Assinatura

- [x] Exibir plano, valor mensal, forma de pagamento, proxima cobranca, situacao e validade do acesso.
- [x] Exibir historico de pagamentos com datas, valores e status, sem misturar compras avulsas com mensalidades.
- [x] Disponibilizar cancelamento e alteracao de pagamento pelo fluxo suportado, com mensagens claras de efeito sobre cobrancas e acesso.
- [x] Mostrar pendencias e caminho para regularizacao, incluindo estados sem assinatura e contratacao em andamento.
- [x] Enviar avisos de falha/regularizacao pelo canal definido, sem repetir avisos para o mesmo evento; SMTP ainda precisa ser configurado.

### 7. Implementar Assinaturas no administrativo

- [x] Listar cliente, plano, valor, forma de pagamento, proxima cobranca e status, com paginacao.
- [x] Filtrar ativas, pendentes, canceladas, em atraso, Pix Automatico, cartao e periodo; identificar Pix manual separadamente se oferecido.
- [x] Disponibilizar detalhe da assinatura com cobrancas, tentativas e historico de alteracoes.
- [x] Permitir conceder, suspender e reativar acesso apenas para administradores, exigindo motivo e registrando auditoria.
- [x] Manter cortesia/excecao separada do pagamento: liberar manualmente nao cria receita ou pagamento ficticio.
- [x] Garantir que webhooks respeitem a precedencia definida para excecoes; reativar acesso manual nao reinicia cobranca no provedor.
- [x] Atualizar indicadores financeiros distinguindo receita efetivamente recebida de previsao recorrente.

### 8. Revisar protecao de acesso e validar a entrega

- [ ] Aplicar a mesma regra de acesso no servidor para detalhes premium, arquivos/downloads, chat IA e demais recursos pagos; esconder controles na interface nao e suficiente.
- [ ] Preservar acessos avulsos conforme as regras definidas, sem revoga-los acidentalmente ao cancelar uma assinatura.
- [ ] Testar primeiro pagamento, renovacao, recusa, atraso, regularizacao, cancelamento, troca do meio de pagamento e estorno.
- [ ] Testar webhook invalido, duplicado, fora de ordem, falha temporaria de persistencia e recuperacao por conciliacao.
- [ ] Testar concessao, suspensao, reativacao, expiracao de cortesia e tentativa de acesso a assinatura de outro cliente.
- [ ] Executar verificacao TypeScript e build conforme os scripts atuais; registrar erros e limitacoes sem declarar checks nao executados como aprovados.
- [ ] Homologar os fluxos no ambiente permitido pelo provedor e validar visualmente celular/desktop. Build nao comprova renovacao nem integracao financeira.
- [ ] Antes da ativacao, conferir credenciais, assinatura dos webhooks, URLs e rotina de conciliacao, sem registrar segredos na documentacao.
- [ ] Registrar o que foi entregue, evidencias dos testes e pendencias. So apresentar Pix Automatico como disponivel depois de validar o fluxo completo.
