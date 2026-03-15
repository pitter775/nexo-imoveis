import Image from 'next/image';
import { FormSelect } from '@/components/form-select';

const PERFIL_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'cliente', label: 'Cliente' },
];

const STATUS_OPTIONS = [
  { value: 'true', label: 'Ativo' },
  { value: 'false', label: 'Inativo' },
];

type UsuarioFormValues = {
  id?: string;
  nome?: string | null;
  email?: string;
  tipo_usuario?: 'admin' | 'cliente' | null;
  ativo?: boolean | null;
  created_at?: string | null;
};

type AdminUsuarioFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  initialValues?: UsuarioFormValues;
  isEdit?: boolean;
};

export function AdminUsuarioForm({
  title,
  description,
  submitLabel,
  action,
  initialValues,
  isEdit = false,
}: AdminUsuarioFormProps) {
  const avatarSeed = initialValues?.email || initialValues?.nome || 'novo-usuario';

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
          Modulo de usuarios
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <form action={action} className="space-y-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}

        <div className="grid gap-8 xl:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <div className="mx-auto relative h-24 w-24 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white">
              <Image
                src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundType=gradientLinear`}
                alt="Avatar do usuario"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm font-semibold text-slate-900">
                {initialValues?.nome || 'Novo usuario'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Avatar automatico gerado pelo nome/email.
              </p>
            </div>
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-xs leading-5 text-slate-500">
              O schema atual de <code>users</code> nao possui campo para foto, entao o modulo usa avatar gerado automaticamente.
            </div>
          </aside>

          <div className="grid gap-6 xl:grid-cols-12">
            <Field
              label="Nome"
              name="nome"
              defaultValue={initialValues?.nome ?? ''}
              required
              className="xl:col-span-5"
            />
            <Field
              label="Email"
              name="email"
              type="email"
              defaultValue={initialValues?.email ?? ''}
              required
              className="xl:col-span-4"
            />
            <FormSelect
              label="Perfil"
              name="tipo_usuario"
              defaultValue={initialValues?.tipo_usuario ?? 'cliente'}
              options={PERFIL_OPTIONS}
              required
              className="xl:col-span-3"
            />
            <Field
              label={isEdit ? 'Nova senha' : 'Senha'}
              name="senha"
              type="password"
              defaultValue=""
              required={!isEdit}
              className="xl:col-span-4"
            />
            <FormSelect
              label="Status"
              name="ativo"
              defaultValue={String(initialValues?.ativo ?? true)}
              options={STATUS_OPTIONS}
              required
              className="xl:col-span-3"
            />
            <InfoField
              label="Cadastro"
              value={formatDate(initialValues?.created_at)}
              className="xl:col-span-5"
            />
            {isEdit ? (
              <div className="xl:col-span-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Deixe a senha em branco para manter a atual.
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end">
          <button className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90">
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = 'text',
  className = '',
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}

function InfoField({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        {value}
      </div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Novo cadastro';
  }

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
