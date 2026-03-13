# Estrutura do Banco de Dados

Sistema: Nexos Leilões  
Banco: Supabase (PostgreSQL)

Este documento descreve as tabelas utilizadas no sistema e suas relações.

---

# users

Tabela de usuários do sistema.

Armazena contas que podem acessar a plataforma.

Campos principais:

- id (uuid)
- nome
- email
- senha_hash
- tipo_usuario (admin ou cliente)
- ativo
- created_at

Relacionamentos:

users.id → pagamentos.user_id  
users.id → user_access.user_id  
users.id → chat_ia.user_id  

---

# imoveis

Tabela principal de imóveis cadastrados no sistema.

Cada registro representa um imóvel disponível para consulta ou leilão.

Campos principais:

- id
- titulo
- descricao
- tipo_leilao
- valor_avaliacao
- valor_minimo
- cidade
- estado
- data_leilao
- status
- created_at

Relacionamentos:

imoveis.id → imovel_imagens.imovel_id  
imoveis.id → imovel_arquivos.imovel_id  
imoveis.id → pagamentos_itens.imovel_id  
imoveis.id → user_access.imovel_id  
imoveis.id → chat_ia.imovel_id  
imoveis.id → leiloes.imovel_id  

---

# imovel_imagens

Armazena imagens relacionadas ao imóvel.

As imagens ficam armazenadas no Supabase Storage e aqui é salvo apenas o URL.

Campos:

- id
- imovel_id
- url
- ordem
- created_at

Relacionamento:

imovel_imagens.imovel_id → imoveis.id

---

# imovel_arquivos

Arquivos associados ao imóvel.

Exemplos:

- edital
- matrícula
- fotos adicionais
- documentos jurídicos

Campos:

- id
- imovel_id
- nome_arquivo
- url_storage
- tipo_arquivo
- visivel_pagantes
- created_at

Regras:

Se visivel_pagantes = true  
apenas usuários com acesso comprado podem baixar.

Relacionamento:

imovel_arquivos.imovel_id → imoveis.id

---

# pagamentos

Registro de pagamentos feitos pelos usuários.

Pode integrar com:

- PIX
- cartão
- gateway de pagamento

Campos:

- id
- user_id
- valor
- metodo
- status
- referencia_gateway
- created_at

Relacionamento:

pagamentos.user_id → users.id

---

# pagamentos_itens

Define quais imóveis estão incluídos em um pagamento.

Campos:

- id
- pagamento_id
- imovel_id
- valor
- created_at

Relacionamentos:

pagamentos_itens.pagamento_id → pagamentos.id  
pagamentos_itens.imovel_id → imoveis.id  

---

# user_access

Controla quais imóveis o usuário tem acesso após pagamento.

Campos:

- id
- user_id
- imovel_id
- data_compra
- data_expiracao
- status
- created_at

Relacionamentos:

user_access.user_id → users.id  
user_access.imovel_id → imoveis.id  

Regra do sistema:

Acesso ao conteúdo completo do imóvel só é permitido se existir registro ativo nesta tabela.

---

# historico_acessos

Registra atividades realizadas pelos usuários.

Exemplos:

- visualizou imóvel
- baixou documento
- iniciou chat IA

Campos:

- id
- user_id
- imovel_id
- acao
- ip
- created_at

---

# chat_ia

Histórico de conversas entre usuário e IA.

Cada conversa está vinculada a um imóvel específico.

Campos:

- id
- user_id
- imovel_id
- mensagem_usuario
- resposta_ia
- created_at

Relacionamentos:

chat_ia.user_id → users.id  
chat_ia.imovel_id → imoveis.id  

Regra:

A IA só pode responder sobre um imóvel se o usuário possuir acesso ativo.

---

# leiloes

Informações específicas sobre o evento de leilão.

Campos:

- id
- imovel_id
- data_inicio
- data_fim
- valor_inicial
- status
- created_at

Relacionamento:

leiloes.imovel_id → imoveis.id
