import { requireAdmin } from '@/lib/auth';
import { listAdminLogs } from '@/lib/admin/logs';

export default async function AdminLogPage() {
  await requireAdmin();
  const logs = await listAdminLogs();

  return (
    <div className="space-y-6">
      <section className="px-1 sm:px-0">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
          Diagnostico
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
          Log
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Ocorrencias recentes do processamento de arquivos, uma por linha.
        </p>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        {logs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div
                key={log.id}
                className="grid gap-3 px-5 py-4 text-sm text-slate-700 lg:grid-cols-[180px_110px_150px_1.1fr_1fr_2fr]"
              >
                <LogCell label="Quando" value={formatDateTime(log.when)} mono />
                <LogLevel level={log.level} />
                <LogCell label="Etapa" value={log.stage} />
                <LogCell label="Imovel" value={log.imovelTitulo} />
                <LogCell label="Arquivo" value={log.fileName} />
                <LogCell label="Mensagem" value={log.message} />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-sm text-slate-500">
            Nenhuma ocorrencia encontrada.
          </div>
        )}
      </section>
    </div>
  );
}

function LogCell({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 lg:hidden">
        {label}
      </span>
      <span className={`block break-words ${mono ? 'font-mono text-[13px]' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function LogLevel({ level }: { level: 'info' | 'warn' | 'error' }) {
  const className =
    level === 'info'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : level === 'warn'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-rose-200 bg-rose-50 text-rose-700';

  return (
    <div className="min-w-0">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 lg:hidden">
        Nivel
      </span>
      <span
        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${className}`}
      >
        {level}
      </span>
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
    second: '2-digit',
  }).format(date);
}
