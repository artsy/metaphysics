import currencyCodes from "lib/currency_codes.json"

export const SUBMISSION_CURRENCY = "USD"

// TODO: Gravity has no resale fee yet. It most likely belongs there now, so the sale
// side charges the rate shown here; then read it from the submission instead.
export const ARTSY_FEE_RATE = 0.15

export interface PriceInput {
  amount: number
  currencyCode: string
}

export const priceCurrencyError = `priceListed currency must be ${SUBMISSION_CURRENCY}`

export const isSubmissionCurrency = ({ currencyCode }: PriceInput) =>
  currencyCode.toUpperCase() === SUBMISSION_CURRENCY

export const toMinor = ({ amount }: PriceInput) =>
  Math.round(
    amount * currencyCodes[SUBMISSION_CURRENCY.toLowerCase()].subunit_to_unit
  )

export const payoutFromMinor = (askingPriceMinor: number) => {
  const artsyFeeMinor = Math.round(askingPriceMinor * ARTSY_FEE_RATE)

  return {
    asking_price_minor: askingPriceMinor,
    artsy_fee_minor: artsyFeeMinor,
    payout_minor: askingPriceMinor - artsyFeeMinor,
  }
}
