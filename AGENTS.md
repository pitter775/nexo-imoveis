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

## Assinaturas: continuidade — 05/10/2026

### Checkout dentro da NEXO — 06/10/2026

- Implementado em `components/subscriptions/embedded-checkout.tsx` e `app/api/pagamentos/checkout/route.ts`.
- Avulso: Payment Brick com Pix QR/Copia e Cola e cartao. Mensal: Card Payment Brick com token
  enviado ao preapproval; permanece R$ 1 em testes. Nenhum desses botoes redireciona ao checkout externo.
- Erros aparecem dentro da janela; login preserva o plano escolhido. Retorno `payment=approved`
  agora depende da consulta do servidor antes de marcar o acesso como liberado.
- Valores/email/referencia definidos no servidor; tentativa avulsa tem chave idempotente por
  usuario/imovel, persistida na aba. Consultas autenticadas conferem dono, moeda e valor.
- Webhook avulso sincroniza antes da busca de faturas de assinatura. Reservas mensais anteriores
  so sao reutilizadas se vinculadas ao mesmo valor/moeda; casos incertos levam a Minha Assinatura.
- Sem SQL ou variaveis novas; usa Public Key, Access Token e webhook existentes da mesma aplicacao.
- Validacao: 14 testes de pagamentos, TypeScript e build aprovados. Pagamento real, SDK autenticado,
  celular e recuperacao de timeout com o provedor ainda precisam de teste. Nao foram criadas cobrancas.
- Commit `e6bd889` publicado: check Vercel success em 06/10/2026
  (https://vercel.com/pitter775s-projects/nexo-imoveis/5hjoUSgAkv3XddUTrBiFdXbTXBXW).
- Smoke local: GET/POST checkout sem sessao retornam 401. Navegador em producao: modal mostra
  R$ 1 mensal/R$ 14,90 avulso; Assinar mensal leva ao login da NEXO com `plano=mensal` preservado
  nos links de Google/cadastro/recuperacao. Sem sessao comum disponivel para testar o SDK/cartao/Pix.

### Decisoes e estado atual

- Fluxo novo ativo no codigo em `lib/payments/subscription-management-db.ts`; sem flag de ambiente.
- Assinatura temporariamente R$ 1,00, com aviso de testes. Valor comercial previsto: R$ 119,00.
- Os registros atuais sao testes, conforme responsavel; nao apagar ou cancelar automaticamente.
- Os dois seeds de 01/10 foram aplicados pelo responsavel no Supabase; schema sincronizado naquela sessao.
- Alteracoes anteriores enviadas: `334d1cc` e `469acd7`. O check Vercel de `469acd7` foi consultado
  nesta retomada e estava em falha; push nao significa deploy confirmado.
- Pix Automatico continua sem confirmacao tecnica para a conta NEXO. Nao inventar endpoints nem
  confundir Pix comum com debito recorrente. Pix comum avulso embutido implementado nesta retomada; falta validar com o provedor.

### Implementado

- Reserva de contratacao, assinatura/cartao recorrente pelo fluxo existente, webhook assinado e
  consulta do pagamento antes de liberar periodo pago.
- Minha Assinatura: resumo, historico, atualizacao manual, cancelamento e troca de cartao.
- Admin > Assinaturas: filtros, historico, auditoria, cortesia, suspensao/reativacao e metricas.
- Conciliacao, fila de avisos por e-mail e verificacoes de acesso no chat e detalhes premium.
- Credenciais obrigatorias verificadas antes de reservar checkout; rejeicao explicita do MP
  permite tentar novamente, mas timeout/5xx preservam reserva para evitar duplicidade.
- Checkout antigo com valor diferente nao e reutilizado silenciosamente; cliente vai para Minha Assinatura.
- Diagnostico de presenca de variaveis apenas no admin, sem exibir valores de segredos.
- Cron reduzido para uma vez ao dia para permitir deploy em Hobby. Webhooks atualizam pagamentos;
  conciliacao e recuperacao. Lote atual: 10 assinaturas; ampliar capacidade antes de escalar.

### Validacao desta retomada

- `npm run test:payments`: 11 testes aprovados (Node 24; script requer suporte a strip-types).
- Cobertura: autorizacao sem pagamento, periodo pago apos cancelamento, expiracao, suspensao,
  cortesia, fim de mes/ano bissexto, webhook valido/adulterado, configuracao e vinculo/valor/moeda da fatura.
- Estes testes NAO comprovam concorrencia SQL, processamento idempotente completo ou renovacao no MP.
- TypeScript e build passaram. Commit `94d6c85` enviado para main e check Vercel confirmado como
  success em 05/10/2026: https://vercel.com/pitter775s-projects/nexo-imoveis/9YfWfvamQRMrqqxVQBWXopRAtN21
- Smoke local standalone: home 200, areas cliente/admin 307 para login, cron e contratacao sem
  autenticacao 401, webhook com ID mas sem assinatura 401. No dominio publico: home 200,
  areas cliente/admin 307 e cron sem autenticacao 401. Nenhum desses checks cria cobranca.
- Nenhuma cobranca real criada, credencial alterada ou SQL aplicado nesta retomada.

### O que o responsavel precisa fazer

Seguir `docs/ativacao-assinaturas.md`: obter chaves na MESMA aplicacao Mercado Pago, conferir
webhook, salvar variaveis Production na Vercel, redeploy e testar R$ 1 com usuario comum.
O documento explica cada variavel, geracao de CRON_SECRET, SMTP e o roteiro de teste real.
Nao pedir flag de ambiente nem reaplicacao dos dois SQL ja confirmados.

### Pendencias para o proximo Codex

1. Confirmar deploy do novo commit e executar ciclo real com credenciais: pagamento, recusa,
   renovacao, estorno, cancelamento, troca do cartao, webhooks e conciliacao.
2. Testar concorrencia/duplicidade/eventos fora de ordem no SQL, faturas futuras e filtros/metricas
   consistentes com cobertura efetiva; validar precedencia de suspensoes entre varias assinaturas.
3. Revisar protecao de arquivos/URLs e todos os caminhos premium. Arquivos marcados publicos
   continuam publicos; nao prometer bloqueio de URLs ja publicadas em bucket publico.
4. Validar telas no celular/desktop e operacoes autenticadas de cliente/admin (inclusive outro usuario).
5. Validar SMTP e cron. Configuracao presente nao significa chave valida nem e-mail entregue.
6. Fechar regras comerciais de atraso/suspensao e confirmar Pix Automatico com documentacao
   tecnica especifica antes de implementar. Validar Pix comum avulso embutido com as credenciais de producao.
7. Ao fim dos testes, restaurar R$ 119 no servidor e rotulos. Assinaturas de R$ 1 existentes no MP
   nao mudam automaticamente de preco; tratar com o responsavel antes de novas renovacoes.

### Arquivos centrais

- `lib/payments/subscription-*.ts`, `lib/payments/webhook-signature.ts`, `lib/payments/mercado-pago.ts`
- `app/api/pagamentos/mercado-pago/webhook/route.ts`, `app/api/cron/assinaturas/route.ts`
- `app/dashboard/assinatura/`, `app/admin/assinaturas/`, `components/subscriptions/`
- `tests/payments/subscriptions.test.mjs`, `docs/ativacao-assinaturas.md`
- `database/seeds/20261001_subscription_management.sql`
- `database/seeds/20261001_subscription_management_metrics_courtesy.sql`

### Continuidade

Ler este resumo, conferir git status e preservar alteracoes antes de editar. Atualizar evidencias
antes de encerrar; distinguir implementado, testado localmente e validado com o provedor.
Nao marcar integracao financeira aprovada com base apenas em build ou presenca de credenciais.
