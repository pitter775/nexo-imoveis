import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env.local') });

const MIN_TARGET_BYTES = 500 * 1024;
const MAX_TARGET_BYTES = 800 * 1024;
const MAX_DIMENSION = 2400;
const BUCKET = 'imoveis';
const isApply = process.argv.includes('--apply');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const backup = {
  createdAt: new Date().toISOString(),
  minTargetBytes: MIN_TARGET_BYTES,
  maxTargetBytes: MAX_TARGET_BYTES,
  apply: isApply,
  originalBackupDir: null,
  items: [],
};

const { data: images, error } = await supabase
  .from('imovel_imagens')
  .select('id, imovel_id, url, ordem')
  .order('imovel_id', { ascending: true })
  .order('ordem', { ascending: true });

if (error) {
  throw new Error(`Nao foi possivel carregar imagens: ${error.message}`);
}

const rows = Number.isFinite(limit) && limit > 0 ? images.slice(0, limit) : images;

console.log(`${isApply ? 'APPLY' : 'DRY-RUN'} - analisando ${rows.length} imagens`);

const originalBackupDir = path.join(
  projectRoot,
  'scripts',
  `optimized-images-originals-${new Date().toISOString().replace(/[:.]/g, '-')}`,
);

if (isApply) {
  await fs.mkdir(originalBackupDir, { recursive: true });
  backup.originalBackupDir = originalBackupDir;
}

let optimizedCount = 0;
let skippedCount = 0;
let failedCount = 0;
let originalTotal = 0;
let optimizedTotal = 0;

for (const image of rows) {
  try {
    const storagePath = extractStoragePath(image.url);

    if (!storagePath) {
      skippedCount += 1;
      console.log(`SKIP ${image.id}: URL fora do storage`);
      continue;
    }

    const originalBuffer = await downloadImage(image.url);
    originalTotal += originalBuffer.length;

    if (originalBuffer.length <= MAX_TARGET_BYTES) {
      skippedCount += 1;
      optimizedTotal += originalBuffer.length;
      console.log(`OK   ${image.id}: ${formatBytes(originalBuffer.length)}`);
      continue;
    }

    const optimizedBuffer = await optimizeBuffer(originalBuffer);
    optimizedTotal += optimizedBuffer.length;

    if (optimizedBuffer.length >= originalBuffer.length) {
      skippedCount += 1;
      console.log(
        `SKIP ${image.id}: sem ganho (${formatBytes(originalBuffer.length)} -> ${formatBytes(
          optimizedBuffer.length,
        )})`,
      );
      continue;
    }

    const nextPath = buildOptimizedPath(storagePath);
    const publicUrl = getPublicUrl(nextPath);
    const localOriginalBackupPath = isApply
      ? path.join(originalBackupDir, `${image.id}${path.extname(storagePath) || '.img'}`)
      : null;
    const itemBackup = {
      id: image.id,
      imovel_id: image.imovel_id,
      oldUrl: image.url,
      newUrl: publicUrl,
      oldPath: storagePath,
      newPath: nextPath,
      localOriginalBackupPath,
      originalBytes: originalBuffer.length,
      optimizedBytes: optimizedBuffer.length,
    };

    backup.items.push(itemBackup);

    console.log(
      `${isApply ? 'SAVE' : 'PLAN'} ${image.id}: ${formatBytes(
        originalBuffer.length,
      )} -> ${formatBytes(optimizedBuffer.length)}`,
    );

    if (!isApply) {
      optimizedCount += 1;
      continue;
    }

    if (localOriginalBackupPath) {
      await fs.writeFile(localOriginalBackupPath, originalBuffer);
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(nextPath, optimizedBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`upload: ${uploadError.message}`);
    }

    const { error: updateError } = await supabase
      .from('imovel_imagens')
      .update({ url: publicUrl })
      .eq('id', image.id);

    if (updateError) {
      throw new Error(`update: ${updateError.message}`);
    }

    if (storagePath !== nextPath) {
      const { error: removeError } = await supabase.storage.from(BUCKET).remove([storagePath]);

      if (removeError) {
        console.warn(`WARN ${image.id}: nao removeu original: ${removeError.message}`);
      }
    }

    optimizedCount += 1;
  } catch (itemError) {
    failedCount += 1;
    console.error(`FAIL ${image.id}:`, itemError instanceof Error ? itemError.message : itemError);
  }
}

const backupPath = path.join(
  projectRoot,
  'scripts',
  `optimized-images-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
);

await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));

console.log('');
console.log(`Otimizadas: ${optimizedCount}`);
console.log(`Ignoradas: ${skippedCount}`);
console.log(`Falhas: ${failedCount}`);
console.log(`Antes: ${formatBytes(originalTotal)}`);
console.log(`Depois estimado: ${formatBytes(optimizedTotal)}`);
console.log(`Backup: ${backupPath}`);

function extractStoragePath(url) {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const markerIndex = parsed.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

function getPublicUrl(storagePath) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function downloadImage(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`download ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function optimizeBuffer(buffer) {
  const metadata = await sharp(buffer).metadata();
  const maxInputDimension = Math.max(metadata.width ?? MAX_DIMENSION, metadata.height ?? MAX_DIMENSION);
  const dimensions = uniqueNumbers([
    Math.min(MAX_DIMENSION, maxInputDimension),
    2200,
    2000,
    1800,
    1600,
    1400,
  ]).filter((dimension) => dimension > 0 && dimension <= maxInputDimension);
  const qualities = [95, 92, 89, 86, 83, 80, 77, 74];
  let bestUnderMax = null;
  let smallestOverMax = null;

  for (const dimension of dimensions) {
    for (const quality of qualities) {
      const output = await sharp(buffer)
        .rotate()
        .resize({
          width: dimension,
          height: dimension,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({
          quality,
          mozjpeg: true,
        })
        .toBuffer();

      if (output.length >= MIN_TARGET_BYTES && output.length <= MAX_TARGET_BYTES) {
        return output;
      }

      if (output.length <= MAX_TARGET_BYTES) {
        if (!bestUnderMax || output.length > bestUnderMax.length) {
          bestUnderMax = output;
        }
      } else if (!smallestOverMax || output.length < smallestOverMax.length) {
        smallestOverMax = output;
      }
    }
  }

  return bestUnderMax ?? smallestOverMax ?? buffer;
}

function uniqueNumbers(values) {
  return [...new Set(values.map((value) => Math.round(value)))].sort(
    (left, right) => right - left,
  );
}

function buildOptimizedPath(storagePath) {
  const parsed = path.posix.parse(storagePath.replaceAll('\\', '/'));
  const baseName = parsed.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return path.posix.join(parsed.dir, `${baseName}-optimized.jpg`);
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
