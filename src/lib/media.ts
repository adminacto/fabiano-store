/** Публичный URL объекта в S3. Ключи генерирует сервер при загрузке (случайные, без имени файла клиента). */
export function mediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  // Файлы из PostgreSQL (пока S3 не настроен)
  if (key.startsWith("db:")) return `/api/media/${key.slice(3)}`;
  const base = process.env.S3_PUBLIC_BASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}
