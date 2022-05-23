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
                slug
              }
              saleArtworks {
                position
                internalID
                isWatching
                isHighestBidder
                lotState {
                  bidCount
                  floorSellingPrice {
                    display
                  }
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
            slug: "sale-1-SLUG",
          },
          saleArtworks: [
            expect.objectContaining({
              internalID: "sale-1-1-only-watched-lot",
              position: 1,
              isWatching: true,
              isHighestBidder: false,
              lotState: null,
            }),
            expect.objectContaining({
              internalID: "sale-1-2-watched-and-bid-lot",
              position: 2,
              isWatching: false,
              isHighestBidder: true,
              lotState: expect.objectContaining({
                saleId: "sale-1",
              }),
            }),
            expect.objectContaining({
              internalID: "sale-1-3-only-bid-lot",
              position: 3,
              isWatching: false,
              isHighestBidder: true,
              lotState: expect.objectContaining({
                saleId: "sale-1",
              }),
            }),
          ],
        },
        {
          sale: {
            liveStartAt: "2022-01-01T00:03:00+00:00",
            endAt: null,
            requireIdentityVerification: false,
            slug: "sale-2-SLUG",
          },
          saleArtworks: [
            expect.objectContaining({
              internalID: "sale-2-4-gravity-bid-lot",
              position: 4,
              isWatching: false,
              isHighestBidder: true,
              lotState: expect.objectContaining({
                saleId: "sale-2",
              }),
              slug:
                "mario-giacomelli-io-non-ho-mani-che-mi-accarezzino-il-volto-22",
            }),
          ],
        },
      ],
    })
  })

  it("returns the correct data shape for closed sales, omitting lots the user did not bid on", async () => {
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
            expect.objectContaining({
              position: 2,
              isWatching: false,
              isHighestBidder: true,
              lotState: expect.objectContaining({
                internalID: "sale-1-2-watched-and-bid-lot",
                saleId: "sale-1",
              }),
            }),
            expect.objectContaining({
              position: 3,
              isWatching: false,
              isHighestBidder: true,
              lotState: expect.objectContaining({
                internalID: "sale-1-3-only-bid-lot",
                saleId: "sale-1",
              }),
            }),
          ],
        },
        {
          sale: {
            liveStartAt: "2022-01-01T00:03:00+00:00",
            endAt: null,
            requireIdentityVerification: false,
          },
          saleArtworks: [
            expect.objectContaining({
              position: 4,
              isWatching: false,
              isHighestBidder: true,
              lotState: expect.objectContaining({
                saleId: "sale-2",
                soldStatus: "Sold",
              }),
              slug:
                "mario-giacomelli-io-non-ho-mani-che-mi-accarezzino-il-volto-22",
            }),
          ],
        },
      ],
    })
  })
})

function getContext(props: { auctionState: "open" | "closed" }) {
  const watchedLotsIds = ["1-only-watched-lot", "2-watched-and-bid-lot"]
  const bidLotIds = {
    "sale-1": ["3-only-bid-lot", "2-watched-and-bid-lot"],
    "sale-2": ["4-gravity-bid-lot"],
  }
  // our lot ordering will be drawn from lot id's leading number
  const positionExtractor = (lotId) => Number(lotId[0])

  const saleIds = ["sale-1"]

  const gravitySaleIds = ["sale-2"]

  // helpers to handle sale id/slug gotchas
  const saleSlug = (id) => id + "-SLUG"
  const unSlug = (idOrSlug) => idOrSlug.replace("-SLUG", "")

  const meLoaderResponse = {
    id: "some-use-id",
    name: "Some User",
  }

  // the request for bidded lots synced to causality
  const causalityGraphQLLoaderResponse = {
    lotStandingConnection: {
      edges: saleIds.flatMap((saleId) =>
        bidLotIds[saleId].map((lotId) => ({
          node: {
            isHighestBidder: true,
            lot: {
              internalID: `${saleId}-${lotId}`,
              saleId: saleId,
              onlineAskingPriceCents: 475000,
              bidCount: 1,
              reserveStatus: "ReserveNotMet",
              sellingPriceCents: 450000,
              soldStatus: "ForSale",
              floorSellingPriceCents: 450000,
            },
          },
        }))
      ),
    },
  }

  // the request for bidded lots not synced to causality
  const lotStandingsWithoutSyncToCausalityResponse = [
    {
      bidder: {
        sale: {
          _id: "sale-2",
          auction_state: "closed",
        },
      },
      sale_artwork: {
        bidder_positions_count: 1,
        highest_bid: {
          amount_cents: 37500,
        },
        lot_id: "5e0d3ace-1cef-4833-957d-e4648aaa7696",
        _id: "sale-2-4-gravity-bid-lot",
        reserve_status: "no_reserve",
      },
      leading_position: {
        active: true,
      },
    },
  ]

  // the request for watched lots
  const saleArtworksAllLoaderResponse = {
    body: saleIds.flatMap((saleId) =>
      watchedLotsIds.map((lotId) => ({
        _id: `${saleId}-${lotId}`,
        sale_id: saleSlug(saleId),
        position: positionExtractor(lotId),
        artwork: {
          _id: "6043c5a145cea0000643f141",
          id: "mario-giacomelli-io-non-ho-mani-che-mi-accarezzino-il-volto-22",
          sale_ids: [saleSlug(saleId)],
        },
        bidder_positions_count: 0,
        display_highest_bid_amount_dollars: null,
        display_minimum_next_bid_dollars: "€2,000",
        highest_bid_amount_cents: null,
        highest_bid: null,
        id: "mario-giacomelli-io-non-ho-mani-che-mi-accarezzino-il-volto-22",
        minimum_next_bid_cents: 200000,
        currency: "EUR",
        estimate_cents: null,
        high_estimate_cents: 250000,
        lot_label: "2",
        lot_number: 2,
        low_estimate_cents: 200000,
        opening_bid_cents: 200000,
        isWatching: true,
        isHighestBidder: true,
      }))
    ),
    headers: {},
  }

  const saleLoaderResponseFactory = (saleId) => ({
    _id: saleId,
    name: "Sale of id " + saleId,
    id: saleSlug(saleId),
    auction_state: props.auctionState,
    created_at: "2021-03-13T17:26:38+00:00",
    currency: "CHF",
    end_at: null,
    ended_at: null,
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
  })

  const salesLoaderWithHeadersResponse = {
    body: saleIds.concat(gravitySaleIds).map(saleLoaderResponseFactory),
    headers: {},
  }

  // the request for gravity sale artworks corresponding
  // to causality and gravity lot standings - reversed to make sure our
  // sorting logic works. assuming only one sale.
  const saleArtworksLoaderResponseFactory = (saleId) => ({
    body: bidLotIds[saleId]
      .map((lotId) => ({
        _id: `${saleId}-${lotId}`,
        sale_id: saleSlug(saleId),
        bidder_positions_count: 0,
        display_highest_bid_amount_dollars: null,
        display_minimum_next_bid_dollars: "€2,000",
        highest_bid_amount_cents: null,
        highest_bid: null,
        id: "mario-giacomelli-io-non-ho-mani-che-mi-accarezzino-il-volto-22",
        minimum_next_bid_cents: 200000,
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
        position: positionExtractor(lotId),
        reserve_status: "no_reserve",
        reserve_unknown: true,
        symbol: "€",
        user_notes: "",
        withdrawn: false,
        withdrawn_at: null,
      }))
      .reverse(),
    headers: {},
  })

  const saleArtworkRootLoaderResponse = {
    currency: "CHF",
  }

  const moneyMajorResolverResponse = 6000

  return {
    meLoader: () => Promise.resolve(meLoaderResponse),
    causalityGraphQLLoader: () =>
      Promise.resolve(causalityGraphQLLoaderResponse), // Causality lot state
    salesLoaderWithHeaders: () =>
      Promise.resolve(salesLoaderWithHeadersResponse), // Registered Sales
    saleArtworksAllLoader: () => Promise.resolve(saleArtworksAllLoaderResponse), // Watched Artworks
    saleLoader: (saleId) =>
      Promise.resolve(saleLoaderResponseFactory(unSlug(saleId))), // All sales
    saleArtworksLoader: (saleId) =>
      Promise.resolve(saleArtworksLoaderResponseFactory(unSlug(saleId))), // Sale Sale artworks
    saleArtworkRootLoader: () => Promise.resolve(saleArtworkRootLoaderResponse), // From fields/money currency conversion
    moneyMajorResolver: () => Promise.resolve(moneyMajorResolverResponse), // From fields/money currency conversion
    lotStandingLoader: () =>
      Promise.resolve(lotStandingsWithoutSyncToCausalityResponse),
  }
}
