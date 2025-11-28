import { priceDisplayText } from "lib/moneyHelpers"

/**
 * Generates a message for an offer inquiry.
 * Returns the buyer's note if provided, otherwise generates a default message
 * with the formatted offer amount.
 *
 * @param note - The buyer's optional note
 * @param amountCents - The offer amount in cents
 * @param currencyCode - The ISO currency code (e.g., "USD", "EUR")
 * @returns A message string for the inquiry
 */
export const getOfferMessage = (
  note: string | null | undefined,
  amountCents: number | null | undefined,
  currencyCode: string | null | undefined
): string => {
  // Use note if provided and not empty/whitespace
  if (note && note.trim().length > 0) {
    return note
  }

  // Fallback if amount data is missing
  if (amountCents == null || currencyCode == null) {
    return "I sent an offer"
  }

  const formattedAmount = priceDisplayText(amountCents, currencyCode, "")

  return `I sent an offer for ${formattedAmount}`
}
