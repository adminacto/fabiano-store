/**
 * Платёжный адаптер FABIANO.
 * Правила:
 *  - Статус PAID выставляется ТОЛЬКО после подтверждения провайдером (webhook с валидной подписью
 *    или серверный запрос статуса). Клиентский redirect "success" ничего не подтверждает.
 *  - Секреты — только process.env на сервере. Этот модуль не импортируется в client components.
 *  - Провайдер без credentials считается отключённым и не показывается в checkout.
 */
import "server-only";

export type ProviderId = "PAYME" | "CLICK" | "CASH_ON_DELIVERY";
export type PaymentState = "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";

export interface CreatePaymentInput {
  paymentId: string;
  orderNumber: string;
  /** Сумма в основной единице валюты (UZS). Адаптер сам конвертирует в тийины, если требуется. */
  amount: string;
  currency: "UZS";
  returnUrl: string;
  locale: "uz" | "ru" | "en";
}

export type CreatePaymentResult =
  | { kind: "redirect"; url: string; providerPaymentId?: string }
  | { kind: "offline" }; // оплата при получении

export interface WebhookRequest {
  headers: Headers;
  rawBody: string;
  ip: string | null;
}

export interface WebhookResult {
  /** Ответ провайдеру в его формате (Payme — JSON-RPC, Click — JSON с error code). */
  httpStatus: number;
  body: unknown;
  /** Изменение состояния платежа, которое сервис применит в транзакции БД. */
  update?: {
    paymentId: string;
    providerPaymentId: string;
    state: PaymentState;
    idempotencyKey: string;
  };
}

export interface PaymentProviderAdapter {
  readonly id: ProviderId;
  /** true, только если все обязательные env-переменные заданы. */
  isConfigured(): boolean;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  /** Проверка подписи/авторизации + разбор события. Невалидная подпись → без update. */
  handleWebhook(req: WebhookRequest): Promise<WebhookResult>;
  /** Серверная сверка статуса у провайдера (для страницы "проверяем оплату" и крон-сверки). */
  fetchStatus(providerPaymentId: string): Promise<PaymentState>;
}
