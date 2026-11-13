// TODO: Gravity has no resale fee yet. It most likely belongs there, so the sale
// side charges the rate shown here; then read it from the submission instead.
export const ARTSY_FEE_RATE = 0.15

export const payoutFromMinor = (askingPriceMinor: number) => {
  const artsyFeeMinor = Math.round(askingPriceMinor * ARTSY_FEE_RATE)

  return {
    asking_price_minor: askingPriceMinor,
    artsy_fee_minor: artsyFeeMinor,
    payout_minor: askingPriceMinor - artsyFeeMinor,
  }
}
