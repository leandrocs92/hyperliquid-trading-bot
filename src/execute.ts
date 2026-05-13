import type { ExchangeClient } from "@nktkas/hyperliquid";
import { logger } from "./logger.js";
import type { OrderIntent } from "./strategy/types.js";

export async function placeOrders(exchange: ExchangeClient, orders: OrderIntent[]) {
  if (orders.length === 0) return;

  const payload = {
    orders: orders.map((o) => ({
      a: o.assetIndex,
      b: o.isBuy,
      p: o.price,
      s: o.size,
      r: o.reduceOnly,
      t: { limit: { tif: o.tif } } as const,
    })),
    grouping: "na" as const,
  };

  logger.info("submitting_orders", { count: orders.length, payload });
  const res = await exchange.order(payload);
  logger.info("order_response", { res });
}
