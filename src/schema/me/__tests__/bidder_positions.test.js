/* eslint-disable promise/always-return */
import { map } from "lodash"
import gql from "lib/gql"

import { runAuthenticatedQuery } from "test/utils"

describe("Me type", () => {
  let rootValue
  let saleArtworkRootLoader
  beforeEach(() => {
    saleArtworkRootLoader = jest.fn()
    saleArtworkRootLoader
      .mockReturnValueOnce(
        Promise.resolve({
          id: "foo",
          _id: 0,
          artwork: { title: "Andy Warhol Skull" },
          sale_id: "else-auction",
        })
      )
      .mockReturnValueOnce(
        Promise.resolve({
          id: "bar",
          _id: 1,
          artwork: { title: "Andy Warhol Skull" },
          highest_bid: { id: "hb2" },
          sale_id: "bar-auction",
        })
      )
      .mockReturnValueOnce(
        Promise.resolve({
          id: "baz",
          _id: 2,
          artwork: { title: "Andy Warhol Skull" },
          sale_id: "else-auction",
        })
      )

    const saleLoader = jest.fn()
    saleLoader
      .mockReturnValueOnce(
        Promise.resolve({
          id: "else-auction",
          auction_state: "open",
        })
      )
      .mockReturnValueOnce(
        Promise.resolve({
          id: "bar-auction",
          auction_state: "closed",
        })
      )
      .mockReturnValueOnce(
        Promise.resolve({
          id: "else-auction",
          auction_state: "open",
        })
      )

    rootValue = {
      saleLoader,
      saleArtworkRootLoader,
      meBidderPositionsLoader: sinon.stub().returns(
        Promise.resolve([
          {
            id: 0,
            max_bid_amount_cents: 1000000,
            sale_artwork_id: 0,
            highest_bid: null,
          },
          {
            id: 1,
            max_bid_amount_cents: 1000000,
            sale_artwork_id: 0,
            highest_bid: { id: "hb1" },
          },
          {
            id: 2,
            max_bid_amount_cents: 1000000,
            sale_artwork_id: 1,
            highest_bid: { id: "hb2" },
          },
          {
            id: 3,
            max_bid_amount_cents: 1000000,
            sale_artwork_id: 0,
            highest_bid: { id: "hb13" },
          },
          {
            id: 4,
            max_bid_amount_cents: 1000000,
            sale_artwork_id: 2,
            highest_bid: { id: "hb4" },
          },
        ])
      ),
    }
  })

  it("returns all bidder positions", () => {
    const query = gql`
      {
        me {
          bidder_positions {
            id
          }
        }
      }
    `
    return runAuthenticatedQuery(query, rootValue).then(data => {
      expect(map(data.me.bidder_positions, "id").join("")).toEqual("01234")
    })
  })

  it("can return only current bidder positions", () => {
    const query = gql`
      {
        me {
          bidder_positions(current: true) {
            id
          }
        }
      }
    `
    return runAuthenticatedQuery(query, rootValue).then(data => {
      expect(map(data.me.bidder_positions, "id").join("")).toEqual("14")
    })
  })

  it("does not fail for bidder positions with unpublished artworks", () => {
    const query = gql`
      {
        me {
          bidder_positions(current: true) {
            id
          }
        }
      }
    `
    rootValue.saleArtworkRootLoader = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve(new Error("Forbidden")))
      .mockReturnValueOnce(
        Promise.resolve({
          id: "bar",
          _id: 1,
          artwork: { title: "Andy Warhol Skull" },
          highest_bid: { id: "hb2" },
          sale_id: "bar-auction",
        })
      )
      .mockReturnValueOnce(
        Promise.resolve({
          id: "baz",
          _id: 0,
          artwork: { title: "Andy Warhol Skull" },
          sale_id: "else-auction",
        })
      )

    return runAuthenticatedQuery(query, rootValue).then(data => {
      expect(map(data.me.bidder_positions, "id").join("")).toEqual("1")
    })
  })

  it("bidder positions can return is_winning based on sale artwork", () => {
    const query = gql`
      {
        me {
          bidder_positions {
            id
            is_winning
          }
        }
      }
    `

    rootValue.saleArtworkRootLoader = jest
      .fn()
      .mockReturnValueOnce(Promise.resolve({}))
      .mockReturnValueOnce(Promise.resolve({}))
      .mockReturnValueOnce(
        Promise.resolve({
          id: "bar",
          _id: 1,
          artwork: { title: "Andy Warhol Skull" },
          highest_bid: { id: "hb2" },
          sale_id: "bar-auction",
        })
      )
      .mockReturnValueOnce(Promise.resolve({}))
      .mockReturnValueOnce(Promise.resolve({}))

    return runAuthenticatedQuery(query, rootValue).then(data => {
      expect(data.me.bidder_positions[2].is_winning).toEqual(true)
    })
  })
})
