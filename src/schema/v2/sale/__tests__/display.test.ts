/* eslint-disable promise/always-return */
import { displayUrgencyTag } from "../display"

describe(displayUrgencyTag, () => {
  it("returns Auction closed when the auction status is not open", async () => {
    const sale = {
      end_at: "2020-07-20T02:50:09+00:00",
      auction_state: "closed",
    }

    expect(
      displayUrgencyTag({
        endAt: sale.end_at,
        auctionState: sale.auction_state,
      })
    ).toEqual(null)
  })

  it("returns time until when a sale is still not closed and has a future endDate", async () => {
    const sale = {
      end_at: "2020-08-20T02:50:09+00:00",
      auction_state: "open",
    }

    expect(
      displayUrgencyTag({
        endAt: sale.end_at,
        auctionState: sale.auction_state,
      })
    ).toEqual("33 hours left")
  })

  it("return time until when a sale is still not closed and has a past endDate", async () => {
    const sale = {
      end_at: "2020-07-20T02:50:09+00:00",
      auction_state: "open",
    }

    expect(
      displayUrgencyTag({
        endAt: sale.end_at,
        auctionState: sale.auction_state,
      })
    ).toEqual(null)
  })
})
