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

const MIN_TARGET_IMAGE_BYTES = 500 * 1024;
const MAX_TARGET_IMAGE_BYTES = 800 * 1024;
const MAX_IMAGE_DIMENSION = 2400;

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
          const optimizedFile = await optimizeImageFile(file);
          const fileName = `imovel-${imovelId}-${Date.now()}-${index}-${sanitizeImageFileName(
            optimizedFile.name,
          )}`;

          const { error: uploadError } = await supabase.storage
            .from('imoveis')
            .upload(fileName, optimizedFile, {
              contentType: optimizedFile.type,
            });

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
    <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-6">
      <div className="flex flex-col gap-3 rounded-[1.25rem] border border-slate-100 bg-slate-50/80 p-3.5">
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
            Imagens do imovel
          </p>
          <h2 className="text-lg font-bold text-slate-900">
            Gerenciar galeria
          </h2>
          <p className="text-sm leading-6 text-slate-500">
            Envie imagens e organize a ordem da galeria. A primeira vira a capa.
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90">
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

      <div className="grid grid-cols-3 gap-2 xl:grid-cols-4">
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
            className={`overflow-hidden rounded-[1rem] border bg-slate-50 transition ${
              draggedUrl === image.url
                ? 'border-primary/40 opacity-70'
                : 'border-slate-200'
            }`}
          >
            <div className="space-y-2 p-2">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm active:cursor-grabbing">
                  <GripVertical className="size-3" />
                </div>

                <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-white">
                  {index === 0 ? 'Capa' : `${image.ordem ?? index + 1}`}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemove(image.url)}
                  disabled={isRemoving || isReordering}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Remover imagem"
                >
                  {isRemoving ? (
                    <LoaderCircle className="size-3 animate-spin" />
                  ) : (
                    <Trash2 className="size-3" />
                  )}
                </button>
              </div>

              <div className="relative aspect-square overflow-hidden rounded-[0.85rem]">
                <Image
                  src={image.url}
                  alt="Imagem do imovel"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="space-y-1">
                {index === 0 ? (
                  <span className="inline-flex rounded-full bg-primary/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-primary">
                    Principal
                  </span>
                ) : null}
                <p className="line-clamp-2 text-[10px] leading-4 text-slate-500">
                  Arraste para ordenar.
                </p>
              </div>
            </div>
          </div>
        ))}

        {images.length === 0 ? (
          <div className="col-span-full rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
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

async function optimizeImageFile(file: File) {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const image = await loadImage(file);
  const bestBlob = await findBestImageBlob(image);

  URL.revokeObjectURL(image.src);

  if (!bestBlob || bestBlob.size >= file.size) {
    return file;
  }

  return new File([bestBlob], replaceImageExtension(file.name), {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

async function findBestImageBlob(image: HTMLImageElement) {
  const originalMaxDimension = Math.max(image.naturalWidth, image.naturalHeight);
  const dimensions = uniqueNumbers([
    Math.min(originalMaxDimension, MAX_IMAGE_DIMENSION),
    2200,
    2000,
    1800,
    1600,
    1400,
  ]).filter((dimension) => dimension > 0 && dimension <= originalMaxDimension);
  const qualities = [0.95, 0.92, 0.89, 0.86, 0.83, 0.8, 0.77, 0.74];
  let bestUnderMax: Blob | null = null;
  let smallestOverMax: Blob | null = null;

  for (const dimension of dimensions) {
    const scale = Math.min(1, dimension / originalMaxDimension);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    for (const quality of qualities) {
      const blob = await renderImageToJpeg(image, width, height, quality);

      if (blob.size >= MIN_TARGET_IMAGE_BYTES && blob.size <= MAX_TARGET_IMAGE_BYTES) {
        return blob;
      }

      if (blob.size <= MAX_TARGET_IMAGE_BYTES) {
        if (!bestUnderMax || blob.size > bestUnderMax.size) {
          bestUnderMax = blob;
        }
      } else if (!smallestOverMax || blob.size < smallestOverMax.size) {
        smallestOverMax = blob;
      }
    }
  }

  return bestUnderMax ?? smallestOverMax;
}

function uniqueNumbers(values: number[]) {
  return [...new Set(values.map((value) => Math.round(value)))].sort(
    (left, right) => right - left,
  );
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = document.createElement('img');
    image.onload = () => resolve(image);
    image.onerror = () => {
      URL.revokeObjectURL(image.src);
      reject(new Error('Nao foi possivel otimizar a imagem.'));
    };
    image.src = URL.createObjectURL(file);
  });
}

function renderImageToJpeg(
  image: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', {
      alpha: false,
    });

    if (!context) {
      reject(new Error('Nao foi possivel preparar a imagem.'));
      return;
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Nao foi possivel comprimir a imagem.'));
          return;
        }

        resolve(blob);
      },
      'image/jpeg',
      quality,
    );
  });
}

function replaceImageExtension(fileName: string) {
  return `${fileName.replace(/\.[^.]+$/, '')}.jpg`;
}

function sanitizeImageFileName(fileName: string) {
  return replaceImageExtension(fileName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}
