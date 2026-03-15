'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { GripVertical, LoaderCircle, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export type ImovelImagem = {
  imovel_id: string;
  url: string;
  ordem: number | null;
};

type AdminImovelImagesProps = {
  imovelId: string;
  initialImages: ImovelImagem[];
};

export function AdminImovelImages({
  imovelId,
  initialImages,
}: AdminImovelImagesProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(initialImages);
  const [error, setError] = useState<string | null>(null);
  const [draggedUrl, setDraggedUrl] = useState<string | null>(null);
  const [isUploading, startUploadTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();
  const [isReordering, startReorderTransition] = useTransition();

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    setError(null);
    startUploadTransition(async () => {
      const uploadedImages: ImovelImagem[] = [];

      try {
        for (const [index, file] of Array.from(files).entries()) {
          const fileName = `imovel-${imovelId}-${Date.now()}-${index}-${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from('imoveis')
            .upload(fileName, file);

          if (uploadError) {
            throw uploadError;
          }

          const { data: publicUrl } = supabase.storage
            .from('imoveis')
            .getPublicUrl(fileName);

          const response = await fetch(`/api/admin/imoveis/${imovelId}/imagens`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: publicUrl.publicUrl,
            }),
          });

          if (!response.ok) {
            throw new Error('Nao foi possivel salvar a imagem do imovel.');
          }

          const data = (await response.json()) as { image: ImovelImagem };
          uploadedImages.push(data.image);
        }

        setImages((current) =>
          [...current, ...uploadedImages].sort(
            (left, right) => (left.ordem ?? 0) - (right.ordem ?? 0),
          ),
        );

        if (inputRef.current) {
          inputRef.current.value = '';
        }
      } catch (uploadError) {
        console.error(uploadError);
        setError('Nao foi possivel concluir o upload das imagens.');
      }
    });
  };

  const handleRemove = async (url: string) => {
    setError(null);

    startRemoveTransition(async () => {
      try {
        const response = await fetch(`/api/admin/imoveis/${imovelId}/imagens`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          throw new Error('Nao foi possivel remover a imagem.');
        }

        setImages((current) => current.filter((image) => image.url !== url));
      } catch (removeError) {
        console.error(removeError);
        setError('Nao foi possivel remover a imagem selecionada.');
      }
    });
  };

  const handleReorder = (sourceUrl: string, targetUrl: string) => {
    if (sourceUrl === targetUrl) {
      return;
    }

    const previousImages = images;
    const nextUrls = reorderUrls(previousImages, sourceUrl, targetUrl);

    setImages((current) => {
      const sourceIndex = current.findIndex((image) => image.url === sourceUrl);
      const targetIndex = current.findIndex((image) => image.url === targetUrl);

      if (sourceIndex === -1 || targetIndex === -1) {
        return current;
      }

      const nextImages = [...current];
      const [movedImage] = nextImages.splice(sourceIndex, 1);
      nextImages.splice(targetIndex, 0, movedImage);

      return nextImages.map((image, index) => ({
        ...image,
        ordem: index + 1,
      }));
    });

    startReorderTransition(async () => {
      try {
        const response = await fetch(`/api/admin/imoveis/${imovelId}/imagens`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            urls: nextUrls,
          }),
        });

        if (!response.ok) {
          throw new Error('Nao foi possivel atualizar a ordem das imagens.');
        }
      } catch (reorderError) {
        console.error(reorderError);
        setError('Nao foi possivel salvar a nova ordem das imagens.');
        setImages(previousImages);
      }
    });
  };

  return (
    <section className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
            Imagens do imovel
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">
            Gerenciar galeria
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Envie multiplas imagens para o bucket <code>imoveis</code> e organize a
            galeria do anuncio. Arraste para reordenar: a primeira imagem vira a capa.
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90">
          {isUploading ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {isUploading ? 'Enviando...' : 'Enviar imagens'}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
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

      {isReordering ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Salvando nova ordem da galeria...
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {images.map((image, index) => (
          <div
            key={image.url}
            draggable
            onDragStart={() => setDraggedUrl(image.url)}
            onDragEnd={() => setDraggedUrl(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggedUrl) {
                handleReorder(draggedUrl, image.url);
                setDraggedUrl(null);
              }
            }}
            className={`overflow-hidden rounded-[1.5rem] border bg-slate-50 transition ${
              draggedUrl === image.url
                ? 'border-primary/40 opacity-70'
                : 'border-slate-200'
            }`}
          >
            <div className="space-y-3 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm active:cursor-grabbing">
                  <GripVertical className="size-4" />
                </div>

                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                  {index === 0 ? 'Capa' : `Ordem ${image.ordem ?? index + 1}`}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemove(image.url)}
                  disabled={isRemoving || isReordering}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Remover imagem"
                >
                  {isRemoving ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </div>

              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem]">
                <Image
                  src={image.url}
                  alt="Imagem do imovel"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="space-y-2">
                {index === 0 ? (
                  <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                    Primeira exibicao
                  </span>
                ) : null}
                <p className="line-clamp-2 text-xs leading-5 text-slate-500">
                  Arraste para reorganizar a galeria.
                </p>
              </div>
            </div>
          </div>
        ))}

        {images.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-500">
            Nenhuma imagem cadastrada para este imovel.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function reorderUrls(
  images: ImovelImagem[],
  sourceUrl: string,
  targetUrl: string,
) {
  const nextImages = [...images];
  const sourceIndex = nextImages.findIndex((image) => image.url === sourceUrl);
  const targetIndex = nextImages.findIndex((image) => image.url === targetUrl);

  if (sourceIndex === -1 || targetIndex === -1) {
    return images.map((image) => image.url);
  }

  const [movedImage] = nextImages.splice(sourceIndex, 1);
  nextImages.splice(targetIndex, 0, movedImage);

  return nextImages.map((image) => image.url);
}
