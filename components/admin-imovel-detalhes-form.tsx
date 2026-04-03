'use client';

import { useEffect, useState } from 'react';

type ImovelDetalhesFormValues = {
  id?: string;
  imovel_id?: string;
  resumo_executivo?: string | null;
  ocupacao?: string | null;
  matricula?: string | null;
  cartorio?: string | null;
  numero_processo?: string | null;
  valor_mercado?: number | null;
  lance_recomendado?: number | null;
  lucro_estimado?: number | null;
  roi_estimado?: number | null;
  divida_iptu?: number | null;
  divida_condominio?: number | null;
  analise?: string | null;
  riscos?: string | null;
  observacoes_juridicas?: string | null;
  estrategia?: string | null;
};

type FieldVisualStatus = 'filled' | 'updated' | 'missing';

type AdminImovelDetalhesFormProps = {
  imovelId: string;
  action: (formData: FormData) => void | Promise<void>;
  initialValues?: ImovelDetalhesFormValues | null;
};

export function AdminImovelDetalhesForm({
  imovelId,
  action,
  initialValues,
}: AdminImovelDetalhesFormProps) {
  const storageKey = `admin-imovel-dossie-preview:${imovelId}`;
  const [values, setValues] = useState<ImovelDetalhesFormValues>(
    initialValues ?? {},
  );
  const [fieldStatuses, setFieldStatuses] = useState<Record<string, FieldVisualStatus>>({});
  const statusSummary = summarizeFieldStatuses(fieldStatuses);

  useEffect(() => {
    setValues(initialValues ?? {});
  }, [initialValues]);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(storageKey);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as {
        values?: Partial<ImovelDetalhesFormValues>;
        statuses?: Record<string, FieldVisualStatus>;
      };
      const nextValues = parsed.values ?? {};

      setValues((current) => ({
        ...current,
        ...Object.fromEntries(
          Object.entries(nextValues).filter(
            ([, value]) => value !== undefined && value !== null && value !== '',
          ),
        ),
      }));
      setFieldStatuses(parsed.statuses ?? {});
    } catch {
      window.sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    const handleAutoFill = (event: Event) => {
      const customEvent = event as CustomEvent<{
        values?: Partial<ImovelDetalhesFormValues>;
        statuses?: Record<string, FieldVisualStatus>;
      }>;
      const nextValues = customEvent.detail?.values ?? {};
      const filteredValues = Object.fromEntries(
        Object.entries(nextValues).filter(
          ([, value]) => value !== undefined && value !== null && value !== '',
        ),
      );

      const payload = {
        values: filteredValues,
        statuses: customEvent.detail?.statuses ?? {},
      };

      window.sessionStorage.setItem(storageKey, JSON.stringify(payload));

      setValues((current) => ({
        ...current,
        ...filteredValues,
      }));
      setFieldStatuses(customEvent.detail?.statuses ?? {});
    };

    window.addEventListener('imovel-dossie-updated', handleAutoFill);
    return () =>
      window.removeEventListener('imovel-dossie-updated', handleAutoFill);
  }, [storageKey]);

  return (
    <form action={action} className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
      <input type="hidden" name="id" value={imovelId} />

      <div>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
          Conteudo premium
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Conteudo do dossie
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Edite aqui o material pago liberado apos a compra do imovel.
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

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-12">
        <TextareaField
          label="Resumo executivo"
          name="resumo_executivo"
          value={values.resumo_executivo ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, resumo_executivo: value }))}
          status={fieldStatuses.resumo_executivo}
          className="md:col-span-2 xl:col-span-12"
        />
        <Field
          label="Ocupacao do imovel"
          name="ocupacao"
          value={values.ocupacao ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, ocupacao: value }))}
          status={fieldStatuses.ocupacao}
          className="md:col-span-1 xl:col-span-4"
        />
        <Field
          label="Matricula"
          name="matricula"
          value={values.matricula ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, matricula: value }))}
          status={fieldStatuses.matricula}
          className="md:col-span-1 xl:col-span-4"
        />
        <Field
          label="Cartorio"
          name="cartorio"
          value={values.cartorio ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, cartorio: value }))}
          status={fieldStatuses.cartorio}
          className="md:col-span-2 xl:col-span-4"
        />
        <Field
          label="Numero do processo"
          name="numero_processo"
          value={values.numero_processo ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, numero_processo: value }))}
          status={fieldStatuses.numero_processo}
          className="md:col-span-2 xl:col-span-6"
        />
        <Field
          label="Valor de mercado"
          name="valor_mercado"
          type="number"
          step="0.01"
          value={formatNumericValue(values.valor_mercado)}
          onChange={(value) => setValues((current) => ({ ...current, valor_mercado: parseNumericValue(value) }))}
          status={fieldStatuses.valor_mercado}
          className="md:col-span-1 xl:col-span-3"
        />
        <Field
          label="Lance recomendado"
          name="lance_recomendado"
          type="number"
          step="0.01"
          value={formatNumericValue(values.lance_recomendado)}
          onChange={(value) => setValues((current) => ({ ...current, lance_recomendado: parseNumericValue(value) }))}
          status={fieldStatuses.lance_recomendado}
          className="md:col-span-1 xl:col-span-3"
        />
        <Field
          label="Lucro estimado"
          name="lucro_estimado"
          type="number"
          step="0.01"
          value={formatNumericValue(values.lucro_estimado)}
          onChange={(value) => setValues((current) => ({ ...current, lucro_estimado: parseNumericValue(value) }))}
          status={fieldStatuses.lucro_estimado}
          className="md:col-span-1 xl:col-span-3"
        />
        <Field
          label="ROI estimado"
          name="roi_estimado"
          type="number"
          step="0.01"
          value={formatNumericValue(values.roi_estimado)}
          onChange={(value) => setValues((current) => ({ ...current, roi_estimado: parseNumericValue(value) }))}
          status={fieldStatuses.roi_estimado}
          className="md:col-span-1 xl:col-span-3"
        />
        <Field
          label="Divida de IPTU"
          name="divida_iptu"
          type="number"
          step="0.01"
          value={formatNumericValue(values.divida_iptu)}
          onChange={(value) => setValues((current) => ({ ...current, divida_iptu: parseNumericValue(value) }))}
          status={fieldStatuses.divida_iptu}
          className="md:col-span-1 xl:col-span-3"
        />
        <Field
          label="Divida de condominio"
          name="divida_condominio"
          type="number"
          step="0.01"
          value={formatNumericValue(values.divida_condominio)}
          onChange={(value) => setValues((current) => ({ ...current, divida_condominio: parseNumericValue(value) }))}
          status={fieldStatuses.divida_condominio}
          className="md:col-span-1 xl:col-span-3"
        />
        <TextareaField
          label="Analise do investimento"
          name="analise"
          value={values.analise ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, analise: value }))}
          status={fieldStatuses.analise}
          className="md:col-span-2 xl:col-span-12"
        />
        <TextareaField
          label="Riscos"
          name="riscos"
          value={values.riscos ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, riscos: value }))}
          status={fieldStatuses.riscos}
          className="md:col-span-2 xl:col-span-6"
        />
        <TextareaField
          label="Observacoes juridicas"
          name="observacoes_juridicas"
          value={values.observacoes_juridicas ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, observacoes_juridicas: value }))}
          status={fieldStatuses.observacoes_juridicas}
          className="md:col-span-2 xl:col-span-6"
        />
        <TextareaField
          label="Estrategia recomendada"
          name="estrategia"
          value={values.estrategia ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, estrategia: value }))}
          status={fieldStatuses.estrategia}
          className="md:col-span-2 xl:col-span-12"
        />
      </div>

      <div className="flex justify-end">
        <button className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90">
          Salvar dossie
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  step,
  status,
  className = '',
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
  status?: FieldVisualStatus;
  className?: string;
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-4 ${getFieldStatusClassName(
          status,
        )}`}
      />
    </label>
  );
}

function TextareaField({
  label,
  name,
  value,
  onChange,
  status,
  className = '',
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  status?: FieldVisualStatus;
  className?: string;
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-4 ${getFieldStatusClassName(
          status,
        )}`}
      />
    </label>
  );
}

function formatNumericValue(value: number | null | undefined) {
  return value == null ? '' : String(value);
}

function parseNumericValue(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
