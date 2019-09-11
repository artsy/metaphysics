/* eslint-disable promise/always-return */
import { runQuery } from "schema/v1/test/utils"

describe("Bidder type", () => {
  let context = null
  const bidder = {
    id: "bidder123",
    created_by_admin: false,
    created_at: "2018-05-29T15:43:22+00:00",
    pin: "1234",
    qualified_for_bidding: true,
    user: {
      id: "user123",
    },
    sale: {
      id: "shared-live-mocktion",
    },
  }

  const user = {
    id: "user123",
    name: "Lucille Bluth",
    email: "lucille@gmail.com",
  }

  const sale = {
    id: "shared-live-mocktion",
    name: "Shared Live Mocktion",
  }

  beforeEach(() => {
    context = {
      bidderLoader: sinon.stub().returns(Promise.resolve(bidder)),
      userByIDLoader: sinon.stub().returns(Promise.resolve(user)),
      saleLoader: sinon.stub().returns(Promise.resolve(sale)),
    }
  })

  it("fetches a bidder by ID", () => {
    const query = `
      {
        bidder(id: "5cdae6b0478dbf000ece64b9") {
          pin
          user {
            name
            email
          }
          sale {
            id
            name
          }
        }
      }
    `

    return runQuery(query, context).then(data => {
      expect(data.bidder.pin).toBe("1234")
      expect(data.bidder.user.name).toEqual("Lucille Bluth")
      expect(data.bidder.sale.name).toEqual("Shared Live Mocktion")
    })
  })
})
