import { FormSelect } from '@/components/form-select';

const TIPO_LEILAO_OPTIONS = [
  { value: 'judicial', label: 'Judicial' },
  { value: 'extrajudicial', label: 'Extrajudicial' },
  { value: 'banco', label: 'Banco' },
  { value: 'particular', label: 'Particular' },
];

const TIPO_PROPRIEDADE_OPTIONS = [
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'galpao', label: 'Galpao' },
  { value: 'fazenda', label: 'Fazenda' },
];

const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'encerrado', label: 'Encerrado' },
];

const ESTADO_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

type ImovelFormValues = {
  id?: string;
  titulo?: string | null;
  descricao?: string | null;
  tipo_leilao?: string | null;
  tipo_propriedade?: string | null;
  valor_avaliacao?: number | null;
  valor_minimo?: number | null;
  quartos?: number | null;
  banheiros?: number | null;
  area_total?: number | null;
  area_construida?: number | null;
  ano_construcao?: number | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  data_leilao?: string | null;
  status?: string | null;
};

type AdminImovelFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  initialValues?: ImovelFormValues;
  showIntro?: boolean;
};

export function AdminImovelForm({
  title,
  description,
  submitLabel,
  action,
  initialValues,
  showIntro = true,
}: AdminImovelFormProps) {
  return (
    <div className="space-y-8">
      {showIntro ? (
        <div className="rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
            Modulo de imoveis
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      ) : null}

      <form action={action} className="space-y-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}

        <div className="grid gap-6 xl:grid-cols-12">
          <Field
            label="Titulo"
            name="titulo"
            defaultValue={initialValues?.titulo ?? ''}
            required
            className="xl:col-span-6"
          />
          <SelectField
            label="Tipo de propriedade"
            name="tipo_propriedade"
            defaultValue={initialValues?.tipo_propriedade ?? ''}
            options={TIPO_PROPRIEDADE_OPTIONS}
            required
            className="xl:col-span-3"
          />
          <SelectField
            label="Tipo de leilao"
            name="tipo_leilao"
            defaultValue={initialValues?.tipo_leilao ?? ''}
            options={TIPO_LEILAO_OPTIONS}
            required
            className="xl:col-span-3"
          />
          <Field
            label="Valor de avaliacao"
            name="valor_avaliacao"
            type="number"
            step="0.01"
            defaultValue={initialValues?.valor_avaliacao ?? ''}
            required
            className="xl:col-span-3"
          />
          <Field
            label="Valor minimo"
            name="valor_minimo"
            type="number"
            step="0.01"
            defaultValue={initialValues?.valor_minimo ?? ''}
            required
            className="xl:col-span-3"
          />
          <Field
            label="Total (m²)"
            name="area_total"
            type="number"
            step="0.01"
            defaultValue={initialValues?.area_total ?? ''}
            className="xl:col-span-2"
          />
          <Field
            label="Construida (m²)"
            name="area_construida"
            type="number"
            step="0.01"
            defaultValue={initialValues?.area_construida ?? ''}
            className="xl:col-span-2"
          />
          <Field
            label="Quartos"
            name="quartos"
            type="number"
            defaultValue={initialValues?.quartos ?? ''}
            className="xl:col-span-2"
          />
          <Field
            label="Banheiros"
            name="banheiros"
            type="number"
            defaultValue={initialValues?.banheiros ?? ''}
            className="xl:col-span-2"
          />
          <Field
            label="Ano de construcao"
            name="ano_construcao"
            type="number"
            defaultValue={initialValues?.ano_construcao ?? ''}
            className="xl:col-span-3"
          />
          <SelectField
            label="Status"
            name="status"
            defaultValue={initialValues?.status ?? 'ativo'}
            options={STATUS_OPTIONS}
            required
            className="xl:col-span-2"
          />
          <Field
            label="Data do leilao"
            name="data_leilao"
            type="datetime-local"
            defaultValue={toDatetimeLocal(initialValues?.data_leilao)}
            required
            className="xl:col-span-4"
          />
          <Field
            label="Rua"
            name="rua"
            defaultValue={initialValues?.rua ?? ''}
            className="xl:col-span-7"
          />
          <Field
            label="Numero"
            name="numero"
            defaultValue={initialValues?.numero ?? ''}
            className="xl:col-span-2"
          />
          <Field
            label="Complemento"
            name="complemento"
            defaultValue={initialValues?.complemento ?? ''}
            className="xl:col-span-3"
          />
          <Field
            label="Cidade"
            name="cidade"
            defaultValue={initialValues?.cidade ?? ''}
            required
            className="xl:col-span-5"
          />
          <SelectField
            label="Estado"
            name="estado"
            defaultValue={initialValues?.estado ?? ''}
            options={ESTADO_OPTIONS.map((estado) => ({ value: estado, label: estado }))}
            required
            className="xl:col-span-3"
          />
          <Field
            label="CEP"
            name="cep"
            defaultValue={initialValues?.cep ?? ''}
            className="xl:col-span-4"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Descricao</label>
          <textarea
            name="descricao"
            defaultValue={initialValues?.descricao ?? ''}
            rows={6}
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
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
  step,
  className = '',
}: {
  label: string;
  name: string;
  defaultValue: string | number;
  required?: boolean;
  type?: string;
  step?: string;
  className?: string;
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  required,
  className = '',
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  className?: string;
}) {
  return (
    <FormSelect
      label={label}
      name={name}
      defaultValue={defaultValue}
      options={options}
      required={required}
      className={className}
    />
  );
}

function toDatetimeLocal(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}
