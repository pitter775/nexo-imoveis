'use client';

import { useRef, useState, useTransition } from 'react';
import { FileText, LoaderCircle, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export type ImovelArquivo = {
  id: string;
  nome_arquivo: string | null;
  url_storage: string | null;
  tipo_arquivo: string | null;
  tipo_documento: string | null;
  visivel_publico: boolean | null;
  visivel_pagantes: boolean | null;
  created_at: string | null;
};

type AdminImovelFilesProps = {
  imovelId: string;
  initialFiles: ImovelArquivo[];
};

const DOCUMENT_OPTIONS = [
  { value: 'edital', label: 'Edital' },
  { value: 'matricula', label: 'Matricula' },
  { value: 'certidao', label: 'Certidao' },
  { value: 'analise', label: 'Analise' },
  { value: 'documentacao', label: 'Documentacao' },
  { value: 'outros', label: 'Outros' },
];

export function AdminImovelFiles({
  imovelId,
  initialFiles,
}: AdminImovelFilesProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState(initialFiles);
  const [error, setError] = useState<string | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState('edital');
  const [visivelPublico, setVisivelPublico] = useState(false);
  const [visivelPagantes, setVisivelPagantes] = useState(true);
  const [isUploading, startUploadTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();

  const handleUpload = async (selectedFiles: FileList | null) => {
    if (!selectedFiles?.length) {
      return;
    }

    setError(null);
    startUploadTransition(async () => {
      const uploadedFiles: ImovelArquivo[] = [];

      try {
        for (const [index, file] of Array.from(selectedFiles).entries()) {
          const fileName = `arquivos/imovel-${imovelId}/${Date.now()}-${index}-${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from('imoveis')
            .upload(fileName, file);

          if (uploadError) {
            throw uploadError;
          }

          const { data: publicUrl } = supabase.storage
            .from('imoveis')
            .getPublicUrl(fileName);

          const response = await fetch(`/api/admin/imoveis/${imovelId}/arquivos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nome_arquivo: file.name,
              url_storage: publicUrl.publicUrl,
              tipo_arquivo: file.type || null,
              tipo_documento: tipoDocumento,
              visivel_publico: visivelPublico,
              visivel_pagantes: visivelPagantes,
            }),
          });

          if (!response.ok) {
            throw new Error('Nao foi possivel salvar o arquivo do dossie.');
          }

          const data = (await response.json()) as { arquivo: ImovelArquivo };
          uploadedFiles.push(data.arquivo);
        }

        setFiles((current) => [...uploadedFiles, ...current]);

        if (inputRef.current) {
          inputRef.current.value = '';
        }
      } catch (uploadError) {
        console.error(uploadError);
        setError('Nao foi possivel concluir o upload dos arquivos.');
      }
    });
  };

  const handleRemove = async (arquivoId: string) => {
    setError(null);

    startRemoveTransition(async () => {
      try {
        const response = await fetch(`/api/admin/imoveis/${imovelId}/arquivos`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ arquivoId }),
        });

        if (!response.ok) {
          throw new Error('Nao foi possivel remover o arquivo.');
        }

        setFiles((current) => current.filter((file) => file.id !== arquivoId));
      } catch (removeError) {
        console.error(removeError);
        setError('Nao foi possivel remover o arquivo selecionado.');
      }
    });
  };

  return (
    <section className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
          Arquivos do dossie
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Gerenciar documentos
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Envie os documentos do imovel e defina quem pode visualizar cada arquivo.
        </p>
      </div>

      <div className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Tipo de documento</span>
          <select
            value={tipoDocumento}
            onChange={(event) => setTipoDocumento(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {DOCUMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={visivelPublico}
            onChange={(event) => setVisivelPublico(event.target.checked)}
            className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          Visivel publico
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={visivelPagantes}
            onChange={(event) => setVisivelPagantes(event.target.checked)}
            className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          Visivel pagantes
        </label>

        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90">
          {isUploading ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {isUploading ? 'Enviando...' : 'Enviar arquivos'}
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => handleUpload(event.target.files)}
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">
                  {file.nome_arquivo ?? 'Arquivo sem nome'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {(file.tipo_documento ?? 'outros').toUpperCase()} ·{' '}
                  {file.visivel_publico ? 'Publico' : 'Nao publico'} ·{' '}
                  {file.visivel_pagantes ? 'Pagantes' : 'Nao pagantes'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {file.url_storage ? (
                <a
                  href={file.url_storage}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-primary transition hover:text-primary/80"
                >
                  Abrir
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => handleRemove(file.id)}
                disabled={isRemoving}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRemoving ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Remover
              </button>
            </div>
          </div>
        ))}

        {files.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-500">
            Nenhum arquivo cadastrado para este imovel.
          </div>
        ) : null}
      </div>
    </section>
  );
}
