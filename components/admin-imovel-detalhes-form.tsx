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
  return (
    <form action={action} className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
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

      <div className="grid gap-6 xl:grid-cols-12">
        <TextareaField
          label="Resumo executivo"
          name="resumo_executivo"
          defaultValue={initialValues?.resumo_executivo ?? ''}
          className="xl:col-span-12"
        />
        <Field
          label="Ocupacao do imovel"
          name="ocupacao"
          defaultValue={initialValues?.ocupacao ?? ''}
          className="xl:col-span-4"
        />
        <Field
          label="Matricula"
          name="matricula"
          defaultValue={initialValues?.matricula ?? ''}
          className="xl:col-span-4"
        />
        <Field
          label="Cartorio"
          name="cartorio"
          defaultValue={initialValues?.cartorio ?? ''}
          className="xl:col-span-4"
        />
        <Field
          label="Numero do processo"
          name="numero_processo"
          defaultValue={initialValues?.numero_processo ?? ''}
          className="xl:col-span-6"
        />
        <Field
          label="Valor de mercado"
          name="valor_mercado"
          type="number"
          step="0.01"
          defaultValue={initialValues?.valor_mercado ?? ''}
          className="xl:col-span-3"
        />
        <Field
          label="Lance recomendado"
          name="lance_recomendado"
          type="number"
          step="0.01"
          defaultValue={initialValues?.lance_recomendado ?? ''}
          className="xl:col-span-3"
        />
        <Field
          label="Lucro estimado"
          name="lucro_estimado"
          type="number"
          step="0.01"
          defaultValue={initialValues?.lucro_estimado ?? ''}
          className="xl:col-span-3"
        />
        <Field
          label="ROI estimado"
          name="roi_estimado"
          type="number"
          step="0.01"
          defaultValue={initialValues?.roi_estimado ?? ''}
          className="xl:col-span-3"
        />
        <Field
          label="Divida de IPTU"
          name="divida_iptu"
          type="number"
          step="0.01"
          defaultValue={initialValues?.divida_iptu ?? ''}
          className="xl:col-span-3"
        />
        <Field
          label="Divida de condominio"
          name="divida_condominio"
          type="number"
          step="0.01"
          defaultValue={initialValues?.divida_condominio ?? ''}
          className="xl:col-span-3"
        />
        <TextareaField
          label="Analise do investimento"
          name="analise"
          defaultValue={initialValues?.analise ?? ''}
          className="xl:col-span-12"
        />
        <TextareaField
          label="Riscos"
          name="riscos"
          defaultValue={initialValues?.riscos ?? ''}
          className="xl:col-span-6"
        />
        <TextareaField
          label="Observacoes juridicas"
          name="observacoes_juridicas"
          defaultValue={initialValues?.observacoes_juridicas ?? ''}
          className="xl:col-span-6"
        />
        <TextareaField
          label="Estrategia recomendada"
          name="estrategia"
          defaultValue={initialValues?.estrategia ?? ''}
          className="xl:col-span-12"
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
  defaultValue,
  type = 'text',
  step,
  className = '',
}: {
  label: string;
  name: string;
  defaultValue: string | number;
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
        defaultValue={defaultValue}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  className = '',
}: {
  label: string;
  name: string;
  defaultValue: string;
  className?: string;
}) {
  return (
    <label className={`space-y-2 ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={5}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}
