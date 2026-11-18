export const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Kutilmoqda", cls: "bg-accent/10 text-accent" },
  CONFIRMED: { label: "Tasdiqlandi", cls: "bg-wine/10 text-wine" },
  PROCESSING: { label: "Yigʻilmoqda", cls: "bg-wine/10 text-wine" },
  SHIPPED: { label: "Yuborildi", cls: "bg-champagne/30 text-ink" },
  DELIVERED: { label: "Yetkazildi", cls: "bg-success/10 text-success" },
  CANCELLED: { label: "Bekor qilindi", cls: "bg-line text-muted" },
  REFUNDED: { label: "Qaytarish", cls: "bg-danger/10 text-danger" },
};

export const PAYMENT_STATUS: Record<string, string> = {
  PENDING: "Toʻlov kutilmoqda",
  AUTHORIZED: "Avtorizatsiya qilingan",
  PAID: "Toʻlangan",
  FAILED: "Toʻlov xatosi",
  CANCELLED: "Bekor qilindi",
  REFUNDED: "Qaytarildi",
};

export const PROVIDER: Record<string, string> = { CASH_ON_DELIVERY: "Qabul qilganda", PAYME: "Payme", CLICK: "Click" };
