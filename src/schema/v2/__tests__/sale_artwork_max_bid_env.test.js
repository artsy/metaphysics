import config from "config"

// This is the key to this one file:
config.BIDDER_POSITION_MAX_BID_AMOUNT_CENTS_LIMIT = 400000

import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { toGlobalId } from "graphql-relay"

describe("SaleArtwork type", () => {
  const saleArtwork = {
    id: "ed-ruscha-pearl-dust-combination-from-insects-portfolio",
    sale_id: "los-angeles-modern-auctions-march-2015",
    highest_bid: {
      cancelled: false,
      amount_cents: 325000,
      display_amount_dollars: "€3,250",
    },
    bidder_positions_count: 7,
    highest_bid_amount_cents: 325000,
    display_highest_bid_amount_dollars: "€3,250",
    minimum_next_bid_cents: 351000,
    display_minimum_next_bid_dollars: "€3,510",
    opening_bid_cents: 180000,
    display_opening_bid_dollars: "€1,800",
    low_estimate_cents: 200000,
    display_low_estimate_dollars: "€2,000",
    high_estimate_cents: 300000,
    display_high_estimate_dollars: "€3,000",
    reserve_status: "reserve_met",
    currency: "EUR",
    symbol: "€",
  }

  const execute = async (
    query,
    gravityResponse = saleArtwork,
    context = {}
  ) => {
    return await runQuery(query, {
      saleArtworkRootLoader: () => Promise.resolve(gravityResponse),
      ...context,
    })
  }

  describe("increments", () => {
    describe("with a max amount set", () => {
      it("does not return increments above the max allowed", async () => {
        const query = gql`
          {
            node(id: "${toGlobalId(
              "SaleArtwork",
              "54c7ed2a7261692bfa910200"
            )}") {
              ... on SaleArtwork {
                increments {
                  cents
                }
              }
            }
          }
        `

        const context = {
          saleLoader: () => {
            return Promise.resolve({
              increment_strategy: "default",
            })
          },
          incrementsLoader: (sale) => {
            return Promise.resolve([
              {
                key: sale.increment_strategy,
                increments: [
                  {
                    from: 0,
                    to: 399999,
                    amount: 5000,
                  },
                  {
                    from: 400000,
                    to: 1000000,
                    amount: 10000,
                  },
                ],
              },
            ])
          },
        }

        const data = await execute(query, saleArtwork, context)
        expect(data.node.increments.slice(0, 20).map((i) => i.cents)).toEqual([
          351000,
          355000,
          360000,
          365000,
          370000,
          375000,
          380000,
          385000,
          390000,
          395000,
          400000,
        ])
      })
    })
  })
})
