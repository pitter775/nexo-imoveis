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

  useEffect(() => {
    setValues(initialValues ?? {});
  }, [initialValues]);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(storageKey);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<ImovelDetalhesFormValues>;
      setValues((current) => ({
        ...current,
        ...Object.fromEntries(
          Object.entries(parsed).filter(
            ([, value]) => value !== undefined && value !== null && value !== '',
          ),
        ),
      }));
    } catch {
      window.sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    const handleAutoFill = (event: Event) => {
      const customEvent = event as CustomEvent<Partial<ImovelDetalhesFormValues>>;
      const nextValues = customEvent.detail ?? {};
      const filteredValues = Object.fromEntries(
        Object.entries(nextValues).filter(
          ([, value]) => value !== undefined && value !== null && value !== '',
        ),
      );

      window.sessionStorage.setItem(storageKey, JSON.stringify(filteredValues));

      setValues((current) => ({
        ...current,
        ...filteredValues,
      }));
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
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-12">
        <TextareaField
          label="Resumo executivo"
          name="resumo_executivo"
          value={values.resumo_executivo ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, resumo_executivo: value }))}
          className="md:col-span-2 xl:col-span-12"
        />
        <Field
          label="Ocupacao do imovel"
          name="ocupacao"
          value={values.ocupacao ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, ocupacao: value }))}
          className="md:col-span-1 xl:col-span-4"
        />
        <Field
          label="Matricula"
          name="matricula"
          value={values.matricula ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, matricula: value }))}
          className="md:col-span-1 xl:col-span-4"
        />
        <Field
          label="Cartorio"
          name="cartorio"
          value={values.cartorio ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, cartorio: value }))}
          className="md:col-span-2 xl:col-span-4"
        />
        <Field
          label="Numero do processo"
          name="numero_processo"
          value={values.numero_processo ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, numero_processo: value }))}
          className="md:col-span-2 xl:col-span-6"
        />
        <Field
          label="Valor de mercado"
          name="valor_mercado"
          type="number"
          step="0.01"
          value={formatNumericValue(values.valor_mercado)}
          onChange={(value) => setValues((current) => ({ ...current, valor_mercado: parseNumericValue(value) }))}
          className="md:col-span-1 xl:col-span-3"
        />
        <Field
          label="Lance recomendado"
          name="lance_recomendado"
          type="number"
          step="0.01"
          value={formatNumericValue(values.lance_recomendado)}
          onChange={(value) => setValues((current) => ({ ...current, lance_recomendado: parseNumericValue(value) }))}
          className="md:col-span-1 xl:col-span-3"
        />
        <Field
          label="Lucro estimado"
          name="lucro_estimado"
          type="number"
          step="0.01"
          value={formatNumericValue(values.lucro_estimado)}
          onChange={(value) => setValues((current) => ({ ...current, lucro_estimado: parseNumericValue(value) }))}
          className="md:col-span-1 xl:col-span-3"
        />
        <Field
          label="ROI estimado"
          name="roi_estimado"
          type="number"
          step="0.01"
          value={formatNumericValue(values.roi_estimado)}
          onChange={(value) => setValues((current) => ({ ...current, roi_estimado: parseNumericValue(value) }))}
          className="md:col-span-1 xl:col-span-3"
        />
        <Field
          label="Divida de IPTU"
          name="divida_iptu"
          type="number"
          step="0.01"
          value={formatNumericValue(values.divida_iptu)}
          onChange={(value) => setValues((current) => ({ ...current, divida_iptu: parseNumericValue(value) }))}
          className="md:col-span-1 xl:col-span-3"
        />
        <Field
          label="Divida de condominio"
          name="divida_condominio"
          type="number"
          step="0.01"
          value={formatNumericValue(values.divida_condominio)}
          onChange={(value) => setValues((current) => ({ ...current, divida_condominio: parseNumericValue(value) }))}
          className="md:col-span-1 xl:col-span-3"
        />
        <TextareaField
          label="Analise do investimento"
          name="analise"
          value={values.analise ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, analise: value }))}
          className="md:col-span-2 xl:col-span-12"
        />
        <TextareaField
          label="Riscos"
          name="riscos"
          value={values.riscos ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, riscos: value }))}
          className="md:col-span-2 xl:col-span-6"
        />
        <TextareaField
          label="Observacoes juridicas"
          name="observacoes_juridicas"
          value={values.observacoes_juridicas ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, observacoes_juridicas: value }))}
          className="md:col-span-2 xl:col-span-6"
        />
        <TextareaField
          label="Estrategia recomendada"
          name="estrategia"
          value={values.estrategia ?? ''}
          onChange={(value) => setValues((current) => ({ ...current, estrategia: value }))}
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
  className = '',
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string) => void;
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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}

function TextareaField({
  label,
  name,
  value,
  onChange,
  className = '',
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
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
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
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
