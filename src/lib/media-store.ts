import "server-only";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "heif", "tiff"]);

export class UploadError extends Error {
  constructor(public code: "TOO_LARGE" | "NOT_IMAGE" | "UNSUPPORTED" | "EMPTY") {
    super(code);
  }
}

/**
 * Загрузка изображения: проверка по содержимому (не по расширению/MIME клиента),
 * перекодирование в WebP (удаляет EXIF и любые встроенные данные), ограничение до 2000 px.
 * Хранится в PostgreSQL (MediaFile) → storageKey "db:<id>". S3 подключается тем же интерфейсом.
 */
export async function storeImage(file: File): Promise<{ storageKey: string; width: number; height: number }> {
  if (!file || file.size === 0) throw new UploadError("EMPTY");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("TOO_LARGE");
  const input = Buffer.from(await file.arrayBuffer());

  let meta: sharp.Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new UploadError("NOT_IMAGE");
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) throw new UploadError("UNSUPPORTED");

  const { data, info } = await sharp(input)
    .rotate() // учитывает ориентацию с телефона, затем метаданные отбрасываются
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const row = await prisma.mediaFile.create({
    data: { mime: "image/webp", width: info.width, height: info.height, size: data.length, data: new Uint8Array(data) },
    select: { id: true },
  });
  return { storageKey: `db:${row.id}`, width: info.width, height: info.height };
}

export async function deleteStoredImage(storageKey: string) {
  if (storageKey.startsWith("db:")) {
    await prisma.mediaFile.deleteMany({ where: { id: storageKey.slice(3) } });
  }
}
