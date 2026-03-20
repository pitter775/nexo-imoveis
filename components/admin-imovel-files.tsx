'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, LoaderCircle, Trash2, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
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
  const router = useRouter();
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearUiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState(initialFiles);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [tipoDocumento, setTipoDocumento] = useState('edital');
  const [visivelPublico, setVisivelPublico] = useState(false);
  const [visivelPagantes, setVisivelPagantes] = useState(true);
  const [isUploading, startUploadTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      if (clearUiTimerRef.current) {
        clearTimeout(clearUiTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  const stopProgressTicker = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const scheduleUiCleanup = () => {
    if (clearUiTimerRef.current) {
      clearTimeout(clearUiTimerRef.current);
    }

    clearUiTimerRef.current = setTimeout(() => {
      setFeedback(null);
      setProgressMessage(null);
      setProgressLog([]);
    }, 5000);
  };

  const pushProgress = (message: string) => {
    setProgressMessage(message);
    setProgressLog((current) =>
      current.includes(message) ? current : [...current, message],
    );
  };

  const startProgressTicker = (fileName: string) => {
    stopProgressTicker();

    const steps = [
      `Analisando a estrutura do PDF ${fileName}...`,
      `Identificando campos principais do documento ${fileName}...`,
      `Mapeando os dados do PDF ${fileName} para o cadastro...`,
      `Salvando os campos encontrados no banco de dados...`,
    ];

    let index = 0;
    progressTimerRef.current = setInterval(() => {
      if (index >= steps.length) {
        stopProgressTicker();
        return;
      }

      pushProgress(steps[index]);
      index += 1;
    }, 2200);
  };

  const handleUpload = async (selectedFiles: FileList | null) => {
    if (!selectedFiles?.length) {
      return;
    }

    setError(null);
    setFeedback(null);
    setProgressMessage(null);
    setProgressLog([]);

    startUploadTransition(async () => {
      const uploadedFiles: ImovelArquivo[] = [];
      const processingMessages: string[] = [];

      try {
        for (const [index, file] of Array.from(selectedFiles).entries()) {
          pushProgress(`Enviando ${file.name} para o storage...`);
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

          pushProgress(`Lendo ${file.name} e mapeando os campos do PDF...`);
          startProgressTicker(file.name);

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

          stopProgressTicker();

          const data = (await response.json()) as {
            arquivo: ImovelArquivo;
            processamento?: {
              status?: string;
              error?: string;
              summary?: string | null;
              extractedFields?: {
                detalhes?: Record<string, unknown>;
              } | null;
            } | null;
          };

          uploadedFiles.push(data.arquivo);

          if (data.processamento?.status === 'concluido') {
            processingMessages.push(
              `${file.name}: PDF lido e dados aproveitados no banco.`,
            );

            if (data.processamento.extractedFields?.detalhes) {
              window.sessionStorage.setItem(
                `admin-imovel-dossie-preview:${imovelId}`,
                JSON.stringify(data.processamento.extractedFields.detalhes),
              );
              window.dispatchEvent(
                new CustomEvent('imovel-dossie-updated', {
                  detail: data.processamento.extractedFields.detalhes,
                }),
              );
            }

            pushProgress(`${file.name}: processamento concluido com sucesso.`);
          } else if (data.processamento?.status === 'erro') {
            processingMessages.push(
              `${file.name}: arquivo salvo, mas a leitura automatica falhou. ${data.processamento.error ?? ''}`.trim(),
            );
            pushProgress(
              `${file.name}: falha na leitura automatica. ${data.processamento?.error ?? ''}`.trim(),
            );
          }
        }

        setFiles((current) => [...uploadedFiles, ...current]);
        setFeedback(processingMessages[0] ?? 'Arquivo enviado com sucesso.');
        pushProgress('Processo concluido. Voce pode enviar outro arquivo.');
        router.refresh();
        scheduleUiCleanup();

        if (inputRef.current) {
          inputRef.current.value = '';
        }
      } catch (uploadError) {
        console.error(uploadError);
        stopProgressTicker();
        setError('Nao foi possivel concluir o upload dos arquivos.');
        setProgressMessage(null);
      }
    });
  };

  const handleRemove = async (arquivoId: string) => {
    setError(null);

    startRemoveTransition(async () => {
      try {
        pushProgress('Removendo arquivo...');
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
        router.refresh();
        pushProgress('Arquivo removido com sucesso.');
        scheduleUiCleanup();
      } catch (removeError) {
        console.error(removeError);
        setError('Nao foi possivel remover o arquivo selecionado.');
        setProgressMessage(null);
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
          <span className="text-sm font-semibold text-slate-700">
            Tipo de documento
          </span>
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

        <motion.label
          whileHover={{ y: -2, scale: 1.01 }}
          whileTap={{ scale: 0.985 }}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
        >
          {isUploading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {isUploading ? 'Enviando...' : 'Enviar arquivos'}
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => handleUpload(event.target.files)}
          />
        </motion.label>
      </div>

      <AnimatePresence mode="popLayout">
        {error ? (
          <motion.div
            key="upload-error"
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.985 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm"
          >
            {error}
          </motion.div>
        ) : null}

        {feedback ? (
          <motion.div
            key="upload-feedback"
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.985 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-3 text-sm text-emerald-700 shadow-[0_18px_45px_-30px_rgba(16,185,129,0.55)]"
          >
            {feedback}
          </motion.div>
        ) : null}

        {progressMessage ? (
          <motion.div
            key="upload-progress"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="overflow-hidden rounded-[1.75rem] border border-sky-200 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(255,255,255,0.96))] px-4 py-4 text-sm text-sky-700 shadow-[0_24px_60px_-38px_rgba(14,165,233,0.55)]"
          >
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
                transition={{
                  duration: 1.8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'easeInOut',
                }}
                className="mt-1 size-2.5 shrink-0 rounded-full bg-sky-500"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{progressMessage}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/70">
                  <motion.div
                    className="h-full rounded-full bg-sky-500"
                    initial={{ x: '-100%' }}
                    animate={{ x: ['-100%', '0%', '100%'] }}
                    transition={{
                      duration: 1.7,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'easeInOut',
                    }}
                  />
                </div>
                {progressLog.length > 0 ? (
                  <div className="mt-3 space-y-1.5 text-xs text-sky-800/90">
                    {progressLog.map((item, index) => (
                      <motion.p
                        key={`${item}-${index}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: Math.min(index * 0.04, 0.24),
                        }}
                      >
                        {`${index + 1}. ${item}`}
                      </motion.p>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {files.map((file, index) => (
            <motion.div
              key={file.id}
              layout
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.985 }}
              transition={{
                duration: 0.24,
                delay: Math.min(index * 0.03, 0.12),
                ease: 'easeOut',
              }}
              whileHover={{ y: -2 }}
              className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.92))] p-4 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.45)] md:flex-row md:items-center md:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <motion.div
                  initial={{ rotate: -6, scale: 0.92 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{
                    duration: 0.22,
                    delay: Math.min(index * 0.03, 0.12),
                  }}
                  className="flex size-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm"
                >
                  <FileText className="size-5" />
                </motion.div>
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
                  <motion.a
                    whileHover={{ y: -1 }}
                    href={file.url_storage}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-primary transition hover:text-primary/80"
                  >
                    Abrir
                  </motion.a>
                ) : null}
                <motion.button
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleRemove(file.id)}
                  disabled={isRemoving}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRemoving ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Remover
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {files.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.75rem] border border-dashed border-slate-300 bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(241,245,249,0.9))] p-8 text-sm text-slate-500"
          >
            Nenhum arquivo cadastrado para este imovel.
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
