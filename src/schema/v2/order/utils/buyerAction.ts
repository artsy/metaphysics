import { OrderJSON } from "../types/exchangeJson"

export type OrderBuyerAction =
  | "PAYMENT_FAILED"
  | "OFFER_RECEIVED_CONFIRM_NEEDED"
  | "OFFER_ACCEPTED_CONFIRM_NEEDED"
  | "OFFER_RECEIVED"
  | "OFFER_ACCEPTED"
  | "PROVISIONAL_OFFER_ACCEPTED"

type BuyerActionOrder = Pick<
  OrderJSON,
  | "buyer_state"
  | "last_submitted_offer"
  | "last_transaction_failed"
  | "mode"
  | "state"
>

/**
 * Whether the order's last transaction failed.
 *
 * Prefers Exchange's `last_transaction_failed` (buyer-only) when present.
 * Older Exchange deployments don't return that key yet, so fall back to
 * `buyer_state === "payment_failed"`. The fallback only covers
 * submitted/in-review orders (that's when Exchange derives that buyer_state),
 * so remove it once Exchange ships `last_transaction_failed`.
 */
const lastTransactionFailed = (order: BuyerActionOrder): boolean => {
  if (order.last_transaction_failed !== undefined) {
    return order.last_transaction_failed === true
  }
  return order.buyer_state === "payment_failed"
}

/**
 * Port of Exchange's `OfferOrderType#buyer_action` + `Offer#buyer_offer_action_type`,
 * called on the order's last submitted offer. Computed entirely from the
 * order JSON (no loader calls), so it's safe on connection nodes.
 *
 * Returns null for:
 * - orders not fetched as the buyer (no `buyer_state`)
 * - non-offer (buy mode) orders
 * - orders without a last submitted offer
 * - every case where Exchange returns nil
 */
export const resolveBuyerAction = (
  order: BuyerActionOrder
): OrderBuyerAction | null => {
  if (!order.buyer_state) return null
  if (order.mode !== "offer") return null

  const offer = order.last_submitted_offer
  if (!offer) return null

  if (lastTransactionFailed(order)) return "PAYMENT_FAILED"

  const fromParticipant = offer.from_participant?.toLowerCase()
  const definesTotal = offer.defines_total === true
  const offerAmountChanged = offer.offer_amount_changed === true

  if (order.state === "submitted" && fromParticipant === "seller") {
    if (definesTotal) {
      // Provisional inquiry checkout offer where metadata was initially missing
      if (offerAmountChanged) return "OFFER_RECEIVED_CONFIRM_NEEDED"
      return "OFFER_ACCEPTED_CONFIRM_NEEDED"
    }
    if (offerAmountChanged) return "OFFER_RECEIVED"
    return null
  }

  if (order.state === "approved" && fromParticipant === "buyer") {
    return "OFFER_ACCEPTED"
  }

  if (order.state === "approved" && fromParticipant === "seller") {
    // Collector confirmed totals on an accepted provisional offer
    if (definesTotal) return "PROVISIONAL_OFFER_ACCEPTED"
    return "OFFER_ACCEPTED"
  }

  return null
}
