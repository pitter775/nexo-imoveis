import { CalendarDays, CircleAlert, Clock, Home, Plus, UserRound } from 'lucide-react';
import { createAgendaEventoAction } from '@/app/admin/agenda/actions';
import { listAgendaEventos } from '@/lib/admin/agenda';
import { listImoveis } from '@/lib/admin/imoveis';
import { listUsuarios } from '@/lib/admin/usuarios';

export default async function AdminAgendaPage() {
  const [usuarios, imoveis] = await Promise.all([listUsuarios(), listImoveis()]);

  try {
    const eventos = await listAgendaEventos();

    return (
      <div className="space-y-6">
        <div className="px-1 sm:px-0">
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
            <CalendarDays className="size-4" />
            Agenda
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            Agenda administrativa
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Registre reuniões, acompanhamentos, prazos de leilão e contatos ligados a
            clientes ou imóveis.
          </p>
        </div>

        <form action={createAgendaEventoAction} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-6 flex items-center gap-2">
            <Plus className="size-5 text-primary" />
            <h2 className="text-xl font-bold text-slate-900">Novo compromisso</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            <Field label="Título" name="titulo" required className="lg:col-span-4" />
            <Field label="Início" name="data_inicio" type="datetime-local" required className="lg:col-span-2" />
            <Field label="Fim" name="data_fim" type="datetime-local" className="lg:col-span-2" />
            <Select
              label="Tipo"
              name="tipo"
              className="lg:col-span-2"
              options={[
                ['geral', 'Geral'],
                ['cliente', 'Cliente'],
                ['imovel', 'Imóvel'],
                ['leilao', 'Leilão'],
                ['atendimento', 'Atendimento'],
              ]}
            />
            <Select
              label="Status"
              name="status"
              className="lg:col-span-2"
              options={[
                ['pendente', 'Pendente'],
                ['confirmado', 'Confirmado'],
                ['concluido', 'Concluído'],
                ['cancelado', 'Cancelado'],
              ]}
            />
            <Select
              label="Cliente"
              name="user_id"
              className="lg:col-span-4"
              includeEmpty="Sem cliente vinculado"
              options={usuarios.map((usuario) => [
                usuario.id,
                usuario.nome ? `${usuario.nome} (${usuario.email})` : usuario.email,
              ])}
            />
            <Select
              label="Imóvel"
              name="imovel_id"
              className="lg:col-span-4"
              includeEmpty="Sem imóvel vinculado"
              options={imoveis.map((imovel) => [
                imovel.id,
                [imovel.titulo, imovel.cidade, imovel.estado].filter(Boolean).join(' - '),
              ])}
            />
            <label className="space-y-2 lg:col-span-12">
              <span className="text-sm font-semibold text-slate-700">Descrição</span>
              <textarea
                name="descricao"
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90">
              Salvar compromisso
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="text-xl font-bold text-slate-900">Próximos compromissos</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {eventos.map((evento) => (
              <div key={evento.id} className="grid gap-4 px-5 py-5 text-sm text-slate-700 lg:grid-cols-[1fr_0.7fr_0.8fr_0.8fr] sm:px-6">
                <div>
                  <p className="font-bold text-slate-900">{evento.titulo}</p>
                  <p className="mt-1 text-slate-500">{evento.descricao || 'Sem descrição.'}</p>
                  <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-500">
                    {evento.tipo}
                  </p>
                </div>
                <DataLine icon={<Clock className="size-4 text-primary" />} label="Data" value={formatDateTime(evento.data_inicio)} />
                <DataLine icon={<UserRound className="size-4 text-primary" />} label="Cliente" value={evento.usuario?.nome || evento.usuario?.email || '-'} />
                <DataLine icon={<Home className="size-4 text-primary" />} label="Imóvel" value={evento.imovel?.titulo || '-'} />
              </div>
            ))}

            {eventos.length === 0 ? (
              <div className="px-6 py-10 text-sm text-slate-500">
                Nenhum compromisso cadastrado.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 size-5 shrink-0" />
          <div>
            <h1 className="text-xl font-bold">Agenda aguardando atualização do banco</h1>
            <p className="mt-2 text-sm leading-6">
              Aplique o script <code>database/seeds/20260727_users_telefone_agenda.sql</code> no Supabase
              para criar a tabela <code>agenda_eventos</code> e liberar este módulo.
            </p>
            <p className="mt-2 text-xs opacity-80">
              {error instanceof Error ? error.message : 'Erro desconhecido.'}
            </p>
          </div>
        </div>
      </div>
    );
  }
}

function Field({
  className = '',
  label,
  name,
  required,
  type = 'text',
}: {
  className?: string;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}

function Select({
  className = '',
  includeEmpty,
  label,
  name,
  options,
}: {
  className?: string;
  includeEmpty?: string;
  label: string;
  name: string;
  options: string[][];
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        name={name}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
      >
        {includeEmpty ? <option value="">{includeEmpty}</option> : null}
        {options.map(([value, labelText]) => (
          <option key={value} value={value}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}

function DataLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="flex items-center gap-2 font-semibold text-slate-700">
        {icon}
        {value}
      </p>
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
