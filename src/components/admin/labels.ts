export const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Ожидает", cls: "bg-accent/10 text-accent" },
  CONFIRMED: { label: "Подтверждён", cls: "bg-wine/10 text-wine" },
  PROCESSING: { label: "Собирается", cls: "bg-wine/10 text-wine" },
  SHIPPED: { label: "Отправлен", cls: "bg-champagne/30 text-ink" },
  DELIVERED: { label: "Доставлен", cls: "bg-success/10 text-success" },
  CANCELLED: { label: "Отменён", cls: "bg-line text-muted" },
  REFUNDED: { label: "Возврат", cls: "bg-danger/10 text-danger" },
};

export const PAYMENT_STATUS: Record<string, string> = {
  PENDING: "Ожидает оплаты",
  AUTHORIZED: "Авторизован",
  PAID: "Оплачен",
  FAILED: "Ошибка оплаты",
  CANCELLED: "Отменён",
  REFUNDED: "Возвращён",
};

export const PROVIDER: Record<string, string> = { CASH_ON_DELIVERY: "При получении", PAYME: "Payme", CLICK: "Click" };
