/**
 * Fabiano Live Virtual Try-On — слой интеграции.
 *
 * Реальный SDK ещё не передан. Поэтому здесь только контракт и feature flag.
 * Никакой имитации примерки (наложения PNG и т.п.) — пока SDK не подключён,
 * кнопка TRY IT ON LIVE не отображается как активная.
 *
 * Включение: FEATURE_TRY_ON=true (env) И StoreSettings.tryOnEnabled И Product.tryOnEnabled
 * И зарегистрированная реализация адаптера.
 */

export interface TryOnGarment {
  productId: string;
  variantId?: string;
  colorCode: string;
  /** Подписанный URL изображения товара (ProductImage.isTryOnAsset). */
  imageUrl: string;
  category: string;
}

export interface TryOnSession {
  /** Привязать поток камеры к SDK и начать рендер в контейнер. */
  start(container: HTMLElement, stream: MediaStream): Promise<void>;
  /** Переключение товара/цвета без перезапуска камеры. */
  setGarment(garment: TryOnGarment): Promise<void>;
  stop(): Promise<void>;
  on(event: "ready" | "error" | "fps", cb: (payload?: unknown) => void): void;
}

export interface TryOnEngine {
  readonly name: string;
  readonly version: string;
  isSupported(): Promise<boolean>; // WebGL/WebGPU, камера, производительность устройства
  /** Короткоживущий токен выдаёт наш backend (/api/try-on/session) — не общий ключ для всех клиентов. */
  createSession(opts: { sessionToken: string; garment: TryOnGarment }): Promise<TryOnSession>;
}

let registered: TryOnEngine | null = null;

/** Вызывается модулем-обёрткой официального Fabiano SDK, когда он будет добавлен. */
export function registerTryOnEngine(engine: TryOnEngine): void {
  registered = engine;
}

export function getTryOnEngine(): TryOnEngine | null {
  return registered;
}

export function isTryOnAvailable(flags: {
  envFlag: boolean;
  storeEnabled: boolean;
  productEnabled: boolean;
}): boolean {
  return flags.envFlag && flags.storeEnabled && flags.productEnabled && registered !== null;
}
