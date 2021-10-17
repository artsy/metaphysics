import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("myBids", () => {
  it("returns the correct data shape for open sales", async () => {
    const query = gql`
      {
        me {
          myBids {
            active {
              sale {
                liveStartAt
                endAt
                requireIdentityVerification
              }
              saleArtworks {
                position
                isWatching
                isHighestBidder
                lotState {
                  bidCount
                  floorSellingPrice {
                    display
                  }
                  internalID
                  onlineAskingPrice {
                    display
                  }
                  reserveStatus
                  saleId
                  sellingPrice {
                    display
                  }
                  soldStatus
                }
                slug
              }
            }
          }
        }
      }
    `

    const context = getContext({ auctionState: "open" })
    const data = await runAuthenticatedQuery(query, context)

    expect(data.me.myBids).toEqual({
      active: [
        {
          sale: {
            liveStartAt: "2022-01-01T00:03:00+00:00",
            endAt: null,
            requireIdentityVerification: false,
          },
          saleArtworks: [
            {
              position: 2,
              isWatching: true,
              isHighestBidder: true,
              lotState: {
                bidCount: 1,
                floorSellingPrice: {
                  display: "CHF4,500",
                },
                internalID: "6043c5a145cea0000643f141",
                onlineAskingPrice: {
                  display: "CHF4,750",
                },
                reserveStatus: "ReserveNotMet",
                saleId: "6043c59e45cea0000643f139",
                sellingPrice: {
                  display: "CHF4,500",
                },
                soldStatus: "ForSale",
              },
              slug:
                "mario-giacomelli-io-non-ho-mani-che-mi-accarezzino-il-volto-22",
            },
          ],
        },
      ],
    })
  })

  it("returns the correct data shape for closed sales", async () => {
    const query = gql`
      {
        me {
          myBids {
            closed {
              sale {
                liveStartAt
                endAt
                requireIdentityVerification
              }
              saleArtworks {
                position
                isWatching
                isHighestBidder
                lotState {
                  bidCount
                  floorSellingPrice {
                    display
                  }
                  internalID
                  onlineAskingPrice {
                    display
                  }
                  reserveStatus
                  saleId
                  sellingPrice {
                    display
                  }
                  soldStatus
                }
                slug
              }
            }
          }
        }
      }
    `

    const context = getContext({ auctionState: "closed" })
    const data = await runAuthenticatedQuery(query, context)

    expect(data.me.myBids).toEqual({
      closed: [
        {
          sale: {
            liveStartAt: "2022-01-01T00:03:00+00:00",
            endAt: null,
            requireIdentityVerification: false,
          },
          saleArtworks: [
            {
              position: 2,
              isWatching: true,
              isHighestBidder: true,
              lotState: {
                bidCount: 1,
                floorSellingPrice: {
                  display: "CHF4,500",
                },
                internalID: "6043c5a145cea0000643f141",
                onlineAskingPrice: {
                  display: "CHF4,750",
                },
                reserveStatus: "ReserveNotMet",
                saleId: "6043c59e45cea0000643f139",
                sellingPrice: {
                  display: "CHF4,500",
                },
                soldStatus: "ForSale",
              },
              slug:
                "mario-giacomelli-io-non-ho-mani-che-mi-accarezzino-il-volto-22",
            },
          ],
        },
      ],
    })
  })
})

function getContext(props: { auctionState: "open" | "closed" }) {
  const meLoaderResponse = {
    id: "some-use-id",
    name: "Some User",
  }

  const causalityLoaderResponse = {
    lotStandingConnection: {
      edges: [
        {
          node: {
            isHighestBidder: true,
            lot: {
              onlineAskingPriceCents: 475000,
              bidCount: 1,
              reserveStatus: "ReserveNotMet",
              sellingPriceCents: 450000,
              soldStatus: "ForSale",
              saleId: "6043c59e45cea0000643f139",
              floorSellingPriceCents: 450000,
              internalID: "6043c5a145cea0000643f141",
            },
          },
        },
      ],
    },
  }

  const saleArtworksAllLoaderResponse = {
    body: [
      {
        artwork: {
          _id: "6043c5a145cea0000643f141",
          id: "mario-giacomelli-io-non-ho-mani-che-mi-accarezzino-il-volto-22",
          sale_ids: ["6043c59e45cea0000643f139"],
        },
        bidder_positions_count: 0,
        display_highest_bid_amount_dollars: null,
        display_minimum_next_bid_dollars: "€2,000",
        highest_bid_amount_cents: null,
        highest_bid: null,
        id: "mario-giacomelli-io-non-ho-mani-che-mi-accarezzino-il-volto-22",
        minimum_next_bid_cents: 200000,
        sale_id: "6043c59e45cea0000643f139",
        _id: "6043c59e45cea0000643f139",
        currency: "EUR",
        estimate_cents: null,
        high_estimate_cents: 250000,
        lot_label: "2",
        lot_number: 2,
        low_estimate_cents: 200000,
        opening_bid_cents: 200000,
        position: 2,
        isWatching: true,
        isHighestBidder: true,
      },
    ],
    headers: {},
  }

  const saleLoaderResponse = {
    _id: "6043c59e45cea0000643f139",
    auction_state: props.auctionState,
    created_at: "2021-03-13T17:26:38+00:00",
    currency: "CHF",
    end_at: null,
    ended_at: null,
    id: "shared-live-mocktion",
    is_auction: true,
    is_benefit: false,
    live_start_at: "2022-01-01T00:03:00+00:00",
    published: true,
    registration_ends_at: null,
    require_bidder_approval: false,
    require_identity_verification: false,
    start_at: "2022-01-01T00:00:00+00:00",
    symbol: "CHF",
    time_zone: "Etc/UTC",
  }

  const salesLoaderWithHeadersResponse = {
    body: [saleLoaderResponse],
    headers: {},
  }

  const saleArtworksLoaderResponse = {
    body: [
      {
        bidder_positions_count: 0,
        display_highest_bid_amount_dollars: null,
        display_minimum_next_bid_dollars: "€2,000",
        highest_bid_amount_cents: null,
        highest_bid: null,
        id: "mario-giacomelli-io-non-ho-mani-che-mi-accarezzino-il-volto-22",
        minimum_next_bid_cents: 200000,
        sale_id: "6043c59e45cea0000643f139",
        _id: "6043c59e45cea0000643f139",
        currency: "EUR",
        display_estimate_dollars: null,
        display_high_estimate_dollars: "€2,500",
        display_low_estimate_dollars: "€2,000",
        display_opening_bid_dollars: "€2,000",
        estimate_cents: null,
        high_estimate_cents: 250000,
        isWatching: true,
        isHighestBidder: true,
        lot_label: "2",
        lot_number: 2,
        low_estimate_cents: 200000,
        opening_bid_cents: 200000,
        position: 2,
        reserve_status: "no_reserve",
        reserve_unknown: true,
        symbol: "€",
        user_notes: "",
        withdrawn: false,
        withdrawn_at: null,
      },
    ],
    headers: {},
  }

  const saleArtworkRootLoaderResponse = {
    currency: "CHF",
  }

  const moneyMajorResolverResponse = 6000

  return {
    meLoader: () => Promise.resolve(meLoaderResponse),
    causalityLoader: () => Promise.resolve(causalityLoaderResponse), // Causality lot state
    salesLoaderWithHeaders: () =>
      Promise.resolve(salesLoaderWithHeadersResponse), // Registered Sales
    saleArtworksAllLoader: () => Promise.resolve(saleArtworksAllLoaderResponse), // Watched Artworks
    saleLoader: () => Promise.resolve(saleLoaderResponse), // All sales
    saleArtworksLoader: () => Promise.resolve(saleArtworksLoaderResponse), // Sale Sale artworks
    saleArtworkRootLoader: () => Promise.resolve(saleArtworkRootLoaderResponse), // From fields/money currency conversion
    moneyMajorResolver: () => Promise.resolve(moneyMajorResolverResponse), // From fields/money currency conversion
  }
}
