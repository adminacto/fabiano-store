/** FB-2026-000123. Последовательность берётся из PostgreSQL SEQUENCE order_number_seq. */
export function formatOrderNumber(year: number, seq: number | bigint): string {
  return `FB-${year}-${seq.toString().padStart(6, "0")}`;
}

export const ORDER_STATUS_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED", "REFUNDED"],
  PROCESSING: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
} as const satisfies Record<string, readonly string[]>;

export type OrderStatus = keyof typeof ORDER_STATUS_TRANSITIONS;

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (ORDER_STATUS_TRANSITIONS[from] as readonly string[]).includes(to);
}
