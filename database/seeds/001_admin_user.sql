insert into public.users (
  nome,
  email,
  senha_hash,
  tipo_usuario,
  ativo
)
values (
  'Administrador',
  'admin@nexo.com',
  '$2b$10$uL.8e91/WnZXNhC9S78K5uRxjcMaSxDQElgkgYwPj.zFU7osDTHcO',
  'admin',
  true
)
on conflict (email) do update
set
  nome = excluded.nome,
  senha_hash = excluded.senha_hash,
  tipo_usuario = excluded.tipo_usuario,
  ativo = excluded.ativo;
