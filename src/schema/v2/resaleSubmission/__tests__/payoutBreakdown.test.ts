import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { meLoader } from "./fixtures"

const query = (payoutArgs = "") => gql`
  {
    me {
      resaleSubmission(id: "gravity-id") {
        artsyFeeRate
        payoutBreakdown${payoutArgs} {
          askingPrice {
            minor
            display
          }
          artsyFee {
            minor
            display
          }
          payout {
            minor
            display
          }
        }
      }
    }
  }
`

const resaleSubmission = async (
  priceListedMinor: number | null,
  payoutArgs?: string
) => {
  const resaleSubmissionLoader = jest.fn(() =>
    Promise.resolve({
      id: "gravity-id",
      price_currency_code: "USD",
      price_listed_minor: priceListedMinor,
    })
  )

  const { me } = await runAuthenticatedQuery(query(payoutArgs), {
    meLoader,
    resaleSubmissionLoader,
  } as any)
  return me.resaleSubmission
}

describe("ResaleSubmission payout", () => {
  it("returns the fee rate and the payout for the saved price", async () => {
    expect(await resaleSubmission(320000)).toEqual({
      artsyFeeRate: 0.15,
      payoutBreakdown: {
        askingPrice: { minor: 320000, display: "US$3,200" },
        artsyFee: { minor: 48000, display: "US$480" },
        payout: { minor: 272000, display: "US$2,720" },
      },
    })
  })

  it("rounds the fee to the nearest cent", async () => {
    const { payoutBreakdown } = await resaleSubmission(100101)

    expect(payoutBreakdown.artsyFee.minor).toEqual(15015)
    expect(payoutBreakdown.payout.minor).toEqual(85086)
  })

  it("is null when no price is saved", async () => {
    expect((await resaleSubmission(null)).payoutBreakdown).toBeNull()
  })

  it("is all zeros for a saved price of 0", async () => {
    const { payoutBreakdown } = await resaleSubmission(0)

    expect(payoutBreakdown).toMatchObject({
      askingPrice: { minor: 0 },
      artsyFee: { minor: 0 },
      payout: { minor: 0 },
    })
  })

  it("previews an unsaved price instead of the saved one", async () => {
    const { payoutBreakdown } = await resaleSubmission(
      320000,
      `(priceListed: { amount: 1000, currencyCode: "USD" })`
    )

    expect(payoutBreakdown).toMatchObject({
      askingPrice: { minor: 100000 },
      artsyFee: { minor: 15000 },
      payout: { minor: 85000 },
    })
  })

  it("previews a price when none is saved", async () => {
    const { payoutBreakdown } = await resaleSubmission(
      null,
      `(priceListed: { amount: 1000, currencyCode: "USD" })`
    )

    expect(payoutBreakdown.payout.minor).toEqual(85000)
  })

  it("errors for a preview in another currency", async () => {
    await expect(
      resaleSubmission(
        320000,
        `(priceListed: { amount: 1000, currencyCode: "EUR" })`
      )
    ).rejects.toThrow("priceListed currency must be USD")
  })
})
