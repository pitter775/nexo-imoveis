'use client';

import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type HTMLAttributes,
} from 'react';
import {
  BadgeDollarSign,
  BedDouble,
  Building2,
  CalendarDays,
  FileText,
  Home,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { FormSelect } from '@/components/form-select';
import { PropertyDescription } from '@/components/property-description';

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
  { value: 'inativo', label: 'Inativo' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'encerrado', label: 'Encerrado' },
];

const ESTADO_OPTIONS = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapa' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceara' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espirito Santo' },
  { value: 'GO', label: 'Goias' },
  { value: 'MA', label: 'Maranhao' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Para' },
  { value: 'PB', label: 'Paraiba' },
  { value: 'PR', label: 'Parana' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piaui' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondonia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'Sao Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

type ImovelFormValues = {
  id?: string;
  titulo?: string | null;
  descricao?: string | null;
  tipo_leilao?: string | null;
  tipo_propriedade?: string | null;
  valor_avaliacao?: number | null;
  valor_minimo?: number | null;
  data_primeiro_leilao?: string | null;
  valor_primeiro_leilao?: number | null;
  data_segundo_leilao?: string | null;
  valor_segundo_leilao?: number | null;
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
  destaque?: boolean | null;
  ordem_destaque?: number | null;
};

type FieldVisualStatus = 'filled' | 'updated' | 'missing';

type AdminImovelFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  initialValues?: ImovelFormValues;
  showIntro?: boolean;
  minimalTitleOnly?: boolean;
  backHref?: string;
  backLabel?: string;
};

export function AdminImovelForm({
  title,
  description,
  submitLabel,
  action,
  initialValues,
  showIntro = true,
  minimalTitleOnly = false,
  backHref,
  backLabel = 'Voltar para gestao de imoveis',
}: AdminImovelFormProps) {
  const storageKey = initialValues?.id
    ? `admin-imovel-dados-preview:${initialValues.id}`
    : null;
  const [valorAvaliacaoInput, setValorAvaliacaoInput] = useState(
    formatCurrencyInput(initialValues?.valor_avaliacao),
  );
  const [valorPrimeiroLeilaoInput, setValorPrimeiroLeilaoInput] = useState(
    formatCurrencyInput(initialValues?.valor_primeiro_leilao ?? initialValues?.valor_minimo),
  );
  const [valorSegundoLeilaoInput, setValorSegundoLeilaoInput] = useState(
    formatCurrencyInput(initialValues?.valor_segundo_leilao),
  );
  const [cepInput, setCepInput] = useState(maskCep(initialValues?.cep ?? ''));
  const [descricaoInput, setDescricaoInput] = useState(initialValues?.descricao ?? '');
  const [fieldStatuses, setFieldStatuses] = useState<Record<string, FieldVisualStatus>>(
    buildImovelMissingStatuses(initialValues, {
      valor_avaliacao: formatCurrencyInput(initialValues?.valor_avaliacao),
      valor_primeiro_leilao: formatCurrencyInput(
        initialValues?.valor_primeiro_leilao ?? initialValues?.valor_minimo,
      ),
      valor_segundo_leilao: formatCurrencyInput(initialValues?.valor_segundo_leilao),
      cep: maskCep(initialValues?.cep ?? ''),
      descricao: initialValues?.descricao ?? '',
    }),
  );
  const descricaoRef = useRef<HTMLTextAreaElement | null>(null);
  const statusSummary = summarizeFieldStatuses(fieldStatuses);

  useEffect(() => {
    autoResizeTextarea(descricaoRef.current);
  }, [descricaoInput]);

  useEffect(() => {
    setFieldStatuses((current) =>
      mergeFieldStatuses(
        current,
        buildImovelMissingStatuses(initialValues, {
          valor_avaliacao: valorAvaliacaoInput,
          valor_primeiro_leilao: valorPrimeiroLeilaoInput,
          valor_segundo_leilao: valorSegundoLeilaoInput,
          cep: cepInput,
          descricao: descricaoInput,
        }),
      ),
    );
  }, [
    initialValues,
    valorAvaliacaoInput,
    valorPrimeiroLeilaoInput,
    valorSegundoLeilaoInput,
    cepInput,
    descricaoInput,
  ]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const stored = window.sessionStorage.getItem(storageKey);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as {
        values?: Partial<ImovelFormValues> | null;
        statuses?: Record<string, FieldVisualStatus>;
      };

      if (parsed.values?.valor_avaliacao != null) {
        setValorAvaliacaoInput(formatCurrencyInput(Number(parsed.values.valor_avaliacao)));
      }

      if (parsed.values?.valor_primeiro_leilao != null) {
        setValorPrimeiroLeilaoInput(
          formatCurrencyInput(Number(parsed.values.valor_primeiro_leilao)),
        );
      }

      if (parsed.values?.valor_segundo_leilao != null) {
        setValorSegundoLeilaoInput(
          formatCurrencyInput(Number(parsed.values.valor_segundo_leilao)),
        );
      }

      if (typeof parsed.values?.cep === 'string') {
        setCepInput(maskCep(parsed.values.cep));
      }

      if (typeof parsed.values?.descricao === 'string') {
        setDescricaoInput(parsed.values.descricao);
      }

      setFieldStatuses(
        mergeFieldStatuses(
          parsed.statuses ?? {},
          buildImovelMissingStatuses(
            {
              ...initialValues,
              ...parsed.values,
            },
            {
              valor_avaliacao:
                parsed.values?.valor_avaliacao != null
                  ? formatCurrencyInput(Number(parsed.values.valor_avaliacao))
                  : valorAvaliacaoInput,
              valor_primeiro_leilao:
                parsed.values?.valor_primeiro_leilao != null
                  ? formatCurrencyInput(Number(parsed.values.valor_primeiro_leilao))
                  : valorPrimeiroLeilaoInput,
              valor_segundo_leilao:
                parsed.values?.valor_segundo_leilao != null
                  ? formatCurrencyInput(Number(parsed.values.valor_segundo_leilao))
                  : valorSegundoLeilaoInput,
              cep:
                typeof parsed.values?.cep === 'string'
                  ? maskCep(parsed.values.cep)
                  : cepInput,
              descricao:
                typeof parsed.values?.descricao === 'string'
                  ? parsed.values.descricao
                  : descricaoInput,
            },
          ),
        ),
      );
    } catch {
      window.sessionStorage.removeItem(storageKey);
    }
  }, [
    storageKey,
    initialValues,
    valorAvaliacaoInput,
    valorPrimeiroLeilaoInput,
    valorSegundoLeilaoInput,
    cepInput,
    descricaoInput,
  ]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const handleAutoFill = (event: Event) => {
      const customEvent = event as CustomEvent<{
        values?: Partial<ImovelFormValues> | null;
        statuses?: Record<string, FieldVisualStatus>;
      }>;

      const nextValues = customEvent.detail?.values ?? null;
      const statuses = customEvent.detail?.statuses ?? {};

      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          values: nextValues,
          statuses,
        }),
      );

      if (nextValues?.valor_avaliacao != null) {
        setValorAvaliacaoInput(formatCurrencyInput(Number(nextValues.valor_avaliacao)));
      }

      if (nextValues?.valor_primeiro_leilao != null) {
        setValorPrimeiroLeilaoInput(
          formatCurrencyInput(Number(nextValues.valor_primeiro_leilao)),
        );
      }

      if (nextValues?.valor_segundo_leilao != null) {
        setValorSegundoLeilaoInput(
          formatCurrencyInput(Number(nextValues.valor_segundo_leilao)),
        );
      }

      if (typeof nextValues?.cep === 'string') {
        setCepInput(maskCep(nextValues.cep));
      }

      if (typeof nextValues?.descricao === 'string') {
        setDescricaoInput(nextValues.descricao);
      }

      setFieldStatuses(
        mergeFieldStatuses(
          statuses,
          buildImovelMissingStatuses(
            {
              ...initialValues,
              ...nextValues,
            },
            {
              valor_avaliacao:
                nextValues?.valor_avaliacao != null
                  ? formatCurrencyInput(Number(nextValues.valor_avaliacao))
                  : valorAvaliacaoInput,
              valor_primeiro_leilao:
                nextValues?.valor_primeiro_leilao != null
                  ? formatCurrencyInput(Number(nextValues.valor_primeiro_leilao))
                  : valorPrimeiroLeilaoInput,
              valor_segundo_leilao:
                nextValues?.valor_segundo_leilao != null
                  ? formatCurrencyInput(Number(nextValues.valor_segundo_leilao))
                  : valorSegundoLeilaoInput,
              cep:
                typeof nextValues?.cep === 'string' ? maskCep(nextValues.cep) : cepInput,
              descricao:
                typeof nextValues?.descricao === 'string'
                  ? nextValues.descricao
                  : descricaoInput,
            },
          ),
        ),
      );
    };

    window.addEventListener('imovel-dados-updated', handleAutoFill);
    return () => window.removeEventListener('imovel-dados-updated', handleAutoFill);
  }, [storageKey]);

  return (
    <div className="space-y-8">
      {showIntro ? (
        <div className="px-1 sm:px-0">
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary/20 hover:text-primary"
            >
              Voltar
            </Link>
          ) : null}
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
            <Building2 className="size-4" />
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

      <form
        action={action}
        className="space-y-8 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8"
      >
        {minimalTitleOnly ? (
          <>
            <Field
              label="Titulo"
              name="titulo"
              defaultValue={initialValues?.titulo ?? ''}
              required
              className="max-w-3xl"
            />

            <div className="flex justify-end">
              <button className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90">
                {submitLabel}
              </button>
            </div>
          </>
        ) : (
          <>
        {!showIntro ? (
          <div>
            {backHref ? (
              <Link
                href={backHref}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary/20 hover:text-primary"
              >
                {backLabel}
              </Link>
            ) : null}
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
              <Home className="size-4" />
              Dados publicos
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Dados do imovel
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Edite as informacoes principais exibidas na plataforma e usadas na vitrine.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                Verde: preenchido pelo arquivo
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                Laranja: alterado pelo arquivo
              </span>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700">
                Azul: ainda falta preencher
              </span>
            </div>
            {statusSummary.total > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                  {statusSummary.filled} preenchidos
                </span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                  {statusSummary.updated} alterados
                </span>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700">
                  {statusSummary.missing} faltando
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {initialValues?.id ? <input type="hidden" name="id" value={initialValues.id} /> : null}
        <input
          type="hidden"
          name="valor_avaliacao"
          value={parseCurrencyInput(valorAvaliacaoInput)}
        />
        <input
          type="hidden"
          name="valor_primeiro_leilao"
          value={parseCurrencyInput(valorPrimeiroLeilaoInput)}
        />
        <input
          type="hidden"
          name="valor_segundo_leilao"
          value={parseCurrencyInput(valorSegundoLeilaoInput)}
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-12">
          <Field
            label="Titulo"
            name="titulo"
            defaultValue={initialValues?.titulo ?? ''}
            required
            status={fieldStatuses.titulo}
            className="md:col-span-2 xl:col-span-6"
          />
          <SelectField
            label="Tipo de propriedade"
            name="tipo_propriedade"
            defaultValue={initialValues?.tipo_propriedade ?? ''}
            options={TIPO_PROPRIEDADE_OPTIONS}
            status={fieldStatuses.tipo_propriedade}
            className="md:col-span-1 xl:col-span-3"
          />
          <SelectField
            label="Tipo de leilao"
            name="tipo_leilao"
            defaultValue={initialValues?.tipo_leilao ?? ''}
            options={TIPO_LEILAO_OPTIONS}
            status={fieldStatuses.tipo_leilao}
            className="md:col-span-1 xl:col-span-3"
          />
          <Field
            label="Valor de avaliacao"
            name="valor_avaliacao_display"
            value={valorAvaliacaoInput}
            onChange={(event) => setValorAvaliacaoInput(maskCurrency(event.target.value))}
            inputMode="numeric"
            status={fieldStatuses.valor_avaliacao}
            className="md:col-span-1 xl:col-span-3"
          />
          <Field
            label="Valor do 1o leilao"
            name="valor_primeiro_leilao_display"
            value={valorPrimeiroLeilaoInput}
            onChange={(event) =>
              setValorPrimeiroLeilaoInput(maskCurrency(event.target.value))
            }
            inputMode="numeric"
            status={fieldStatuses.valor_primeiro_leilao || fieldStatuses.valor_minimo}
            className="md:col-span-1 xl:col-span-3"
          />
          <Field
            label="Data do 1o leilao"
            name="data_primeiro_leilao"
            type="datetime-local"
            defaultValue={toDatetimeLocal(
              initialValues?.data_primeiro_leilao ?? initialValues?.data_leilao,
            )}
            status={fieldStatuses.data_primeiro_leilao || fieldStatuses.data_leilao}
            className="md:col-span-1 xl:col-span-4"
          />
          <Field
            label="Valor do 2o leilao"
            name="valor_segundo_leilao_display"
            value={valorSegundoLeilaoInput}
            onChange={(event) =>
              setValorSegundoLeilaoInput(maskCurrency(event.target.value))
            }
            inputMode="numeric"
            status={fieldStatuses.valor_segundo_leilao}
            className="md:col-span-1 xl:col-span-3"
          />
          <Field
            label="Data do 2o leilao"
            name="data_segundo_leilao"
            type="datetime-local"
            defaultValue={toDatetimeLocal(initialValues?.data_segundo_leilao)}
            status={fieldStatuses.data_segundo_leilao}
            className="md:col-span-1 xl:col-span-4"
          />
          <Field
            label="Total (m2)"
            name="area_total"
            type="number"
            step="0.01"
            defaultValue={initialValues?.area_total ?? ''}
            status={fieldStatuses.area_total}
            className="md:col-span-1 xl:col-span-2"
          />
          <Field
            label="Construida (m2)"
            name="area_construida"
            type="number"
            step="0.01"
            defaultValue={initialValues?.area_construida ?? ''}
            status={fieldStatuses.area_construida}
            className="md:col-span-1 xl:col-span-2"
          />
          <Field
            label="Quartos"
            name="quartos"
            type="number"
            defaultValue={initialValues?.quartos ?? ''}
            status={fieldStatuses.quartos}
            className="md:col-span-1 xl:col-span-2"
          />
          <Field
            label="Banheiros"
            name="banheiros"
            type="number"
            defaultValue={initialValues?.banheiros ?? ''}
            status={fieldStatuses.banheiros}
            className="md:col-span-1 xl:col-span-2"
          />
          <Field
            label="Ano de construcao"
            name="ano_construcao"
            type="number"
            defaultValue={initialValues?.ano_construcao ?? ''}
            status={fieldStatuses.ano_construcao}
            className="md:col-span-1 xl:col-span-3"
          />
          <SelectField
            label="Status"
            name="status"
            defaultValue={initialValues?.status ?? 'ativo'}
            options={STATUS_OPTIONS}
            status={fieldStatuses.status}
            className="md:col-span-1 xl:col-span-3"
          />
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2 xl:col-span-4 xl:self-end">
            <input
              type="checkbox"
              name="destaque"
              defaultChecked={Boolean(initialValues?.destaque)}
              className="size-4 rounded border-slate-300 text-primary focus:ring-primary/20"
            />
            <span className="text-sm font-semibold text-slate-700">
              Destaque
            </span>
          </label>
          <Field
            label="Ordem do destaque"
            name="ordem_destaque"
            type="number"
            defaultValue={initialValues?.ordem_destaque ?? ''}
            className="md:col-span-1 xl:col-span-3"
          />
          <Field
            label="Rua"
            name="rua"
            defaultValue={initialValues?.rua ?? ''}
            status={fieldStatuses.rua}
            className="md:col-span-2 xl:col-span-7"
          />
          <Field
            label="Numero"
            name="numero"
            defaultValue={initialValues?.numero ?? ''}
            status={fieldStatuses.numero}
            className="md:col-span-1 xl:col-span-2"
          />
          <Field
            label="Complemento"
            name="complemento"
            defaultValue={initialValues?.complemento ?? ''}
            status={fieldStatuses.complemento}
            className="md:col-span-1 xl:col-span-3"
          />
          <Field
            label="Cidade"
            name="cidade"
            defaultValue={initialValues?.cidade ?? ''}
            status={fieldStatuses.cidade}
            className="md:col-span-1 xl:col-span-5"
          />
          <SelectField
            label="Estado"
            name="estado"
            defaultValue={initialValues?.estado ?? ''}
            options={ESTADO_OPTIONS}
            status={fieldStatuses.estado}
            className="md:col-span-1 xl:col-span-3"
          />
          <Field
            label="CEP"
            name="cep"
            value={cepInput}
            onChange={(event) => setCepInput(maskCep(event.target.value))}
            inputMode="numeric"
            status={fieldStatuses.cep}
            className="md:col-span-1 xl:col-span-4"
          />
        </div>

        <div className="space-y-2">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FileText className="size-4 text-primary" />
            Descricao
          </label>
          <textarea
            ref={descricaoRef}
            name="descricao"
            value={descricaoInput}
            onChange={(event) => setDescricaoInput(event.target.value)}
            rows={6}
            className={`min-h-[180px] w-full resize-none overflow-hidden rounded-2xl border bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:bg-white focus:ring-4 ${getFieldStatusClassName(
              fieldStatuses.descricao,
            )}`}
          />
          {descricaoInput.trim() ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                Preview da descricao
              </p>
              <PropertyDescription value={descricaoInput} />
            </div>
          ) : null}
        </div>

        <div className="flex justify-end">
          <button className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90">
            {submitLabel}
          </button>
        </div>
          </>
        )}
      </form>
    </div>
  );
}

function buildImovelMissingStatuses(
  values: ImovelFormValues | undefined,
  derived: {
    valor_avaliacao: string;
    valor_primeiro_leilao: string;
    valor_segundo_leilao: string;
    cep: string;
    descricao: string;
  },
) {
  const statuses: Record<string, FieldVisualStatus> = {};
  const checks: Array<[string, unknown]> = [
    ['titulo', values?.titulo],
    ['tipo_propriedade', values?.tipo_propriedade],
    ['tipo_leilao', values?.tipo_leilao],
    ['valor_avaliacao', derived.valor_avaliacao],
    ['valor_primeiro_leilao', derived.valor_primeiro_leilao],
    ['data_primeiro_leilao', values?.data_primeiro_leilao ?? values?.data_leilao],
    ['valor_segundo_leilao', derived.valor_segundo_leilao],
    ['data_segundo_leilao', values?.data_segundo_leilao],
    ['area_total', values?.area_total],
    ['area_construida', values?.area_construida],
    ['quartos', values?.quartos],
    ['banheiros', values?.banheiros],
    ['ano_construcao', values?.ano_construcao],
    ['rua', values?.rua],
    ['numero', values?.numero],
    ['complemento', values?.complemento],
    ['cidade', values?.cidade],
    ['estado', values?.estado],
    ['cep', derived.cep],
    ['descricao', derived.descricao],
  ];

  for (const [field, value] of checks) {
    if (isBlankValue(value)) {
      statuses[field] = 'missing';
    }
  }

  return statuses;
}

function mergeFieldStatuses(
  base: Record<string, FieldVisualStatus>,
  missing: Record<string, FieldVisualStatus>,
) {
  const next = { ...base };

  for (const key of Object.keys(next)) {
    if (next[key] === 'missing' && !missing[key]) {
      delete next[key];
    }
  }

  for (const [key, status] of Object.entries(missing)) {
    if (base[key] !== 'filled' && base[key] !== 'updated') {
      next[key] = status;
    }
  }

  return next;
}

function isBlankValue(value: unknown) {
  if (value == null) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim() === '';
  }

  return false;
}

function Field({
  label,
  name,
  defaultValue,
  value,
  onChange,
  required,
  type = 'text',
  step,
  inputMode,
  status,
  className = '',
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  step?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  status?: FieldVisualStatus;
  className?: string;
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
        <FieldIcon label={label} />
        {label}
      </span>
      <input
        name={name}
        type={type}
        step={step}
        inputMode={inputMode}
        required={required}
        defaultValue={value == null ? defaultValue : undefined}
        value={value}
        onChange={onChange}
        className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-4 ${getFieldStatusClassName(
          status,
        )}`}
      />
    </label>
  );
}

function FieldIcon({ label }: { label: string }) {
  const normalizedLabel = label.toLowerCase();

  if (normalizedLabel.includes('valor')) {
    return <BadgeDollarSign className="size-4 text-primary" />;
  }

  if (normalizedLabel.includes('quarto') || normalizedLabel.includes('banheiro')) {
    return <BedDouble className="size-4 text-primary" />;
  }

  if (normalizedLabel.includes('data')) {
    return <CalendarDays className="size-4 text-primary" />;
  }

  if (
    normalizedLabel.includes('rua') ||
    normalizedLabel.includes('cidade') ||
    normalizedLabel.includes('estado') ||
    normalizedLabel.includes('cep') ||
    normalizedLabel.includes('numero') ||
    normalizedLabel.includes('complemento')
  ) {
    return <MapPin className="size-4 text-primary" />;
  }

  if (
    normalizedLabel.includes('tipo') ||
    normalizedLabel.includes('status') ||
    normalizedLabel.includes('destaque')
  ) {
    return <Sparkles className="size-4 text-primary" />;
  }

  return <Home className="size-4 text-primary" />;
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  required,
  status,
  className = '',
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  status?: FieldVisualStatus;
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
      controlClassName={getFieldStatusClassName(status)}
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

function maskCurrency(value: string) {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  const amount = Number(digits) / 100;

  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function parseCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  return (Number(digits) / 100).toFixed(2);
}

function formatCurrencyInput(value?: number | null) {
  if (value == null) {
    return '';
  }

  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function maskCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function autoResizeTextarea(element: HTMLTextAreaElement | null) {
  if (!element) {
    return;
  }

  element.style.height = 'auto';
  element.style.height = `${element.scrollHeight}px`;
}

function getFieldStatusClassName(status?: FieldVisualStatus) {
  switch (status) {
    case 'filled':
      return 'border-emerald-300 bg-emerald-50/40 focus:border-emerald-400 focus:ring-emerald-100';
    case 'updated':
      return 'border-amber-300 bg-amber-50/40 focus:border-amber-400 focus:ring-amber-100';
    case 'missing':
      return 'border-sky-300 bg-sky-50/40 focus:border-sky-400 focus:ring-sky-100';
    default:
      return 'border-slate-200 focus:border-primary focus:ring-primary/10';
  }
}

function summarizeFieldStatuses(statuses: Record<string, FieldVisualStatus>) {
  const values = Object.values(statuses);

  return {
    filled: values.filter((value) => value === 'filled').length,
    updated: values.filter((value) => value === 'updated').length,
    missing: values.filter((value) => value === 'missing').length,
    total: values.length,
  };
}
