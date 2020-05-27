/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"
import { toGlobalId } from "graphql-relay"

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
      bidderLoader: jest.fn(() => Promise.resolve(bidder)),
      userByIDLoader: jest.fn(() => Promise.resolve(user)),
      saleLoader: jest.fn(() => Promise.resolve(sale)),
    }
  })

  it("fetches a bidder by ID", () => {
    const query = `
      query($id: ID!) {
        node(id: $id) {
          ... on Bidder {
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
      }
    `
    const variables = {
      id: toGlobalId("Bidder", "5cdae6b0478dbf000ece64b9"),
    }

    return runQuery(query, context, variables).then((data) => {
      expect(data.node.pin).toBe("1234")
      expect(data.node.user.name).toEqual("Lucille Bluth")
      expect(data.node.sale.name).toEqual("Shared Live Mocktion")
    })
  })
})
