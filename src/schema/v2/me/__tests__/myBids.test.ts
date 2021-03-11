import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("myBids", () => {
  it("returns the correct data shape for open sales", async () => {
    const query = gql`
      {
        me {
          myBids {
            active {
              isWatching
              sale {
                liveStartAt
                endAt
                requireIdentityVerification
              }
              saleArtworks {
                position
                lot {
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
          isWatching: false,
          sale: {
            liveStartAt: "2022-01-01T00:03:00+00:00",
            endAt: null,
            requireIdentityVerification: false,
          },
          saleArtworks: [
            {
              position: 2,
              lot: {
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
              isWatching
              sale {
                liveStartAt
                endAt
                requireIdentityVerification
              }
              saleArtworks {
                position
                lot {
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
          isWatching: false,
          sale: {
            liveStartAt: "2022-01-01T00:03:00+00:00",
            endAt: null,
            requireIdentityVerification: false,
          },
          saleArtworks: [
            {
              position: 2,
              lot: {
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
        artwork: {
          artist: {
            _id: "4f552b2e3b555241700000f8",
            id: "mario-giacomelli",
            sortable_id: "giacomelli-mario",
            name: "Mario Giacomelli",
            years: "1925-2000",
            public: true,
            birthday: "1925",
            consignable: false,
            deathday: "2000",
            nationality: "Italian",
            published_artworks_count: 237,
            forsale_artworks_count: 79,
            artworks_count: 780,
            original_width: null,
            original_height: null,
            image_url:
              "https://d32dm0rphc51dk.cloudfront.net/8xLzgRMBP-o5Ijb_HIYIPQ/:version.jpg",
            image_versions: ["four_thirds", "large", "square", "tall"],
            image_urls: {
              four_thirds:
                "https://d32dm0rphc51dk.cloudfront.net/8xLzgRMBP-o5Ijb_HIYIPQ/four_thirds.jpg",
              large:
                "https://d32dm0rphc51dk.cloudfront.net/8xLzgRMBP-o5Ijb_HIYIPQ/large.jpg",
              square:
                "https://d32dm0rphc51dk.cloudfront.net/8xLzgRMBP-o5Ijb_HIYIPQ/square.jpg",
              tall:
                "https://d32dm0rphc51dk.cloudfront.net/8xLzgRMBP-o5Ijb_HIYIPQ/tall.jpg",
            },
            target_supply: true,
          },
          partner: {
            partner_categories: [],
            _id: "5a09f2658b0c14629143a456",
            id: "finarte",
            default_profile_id: "finarte",
            default_profile_public: false,
            sortable_id: "finarte",
            type: "Auction",
            name: "Finarte",
            short_name: "",
            pre_qualify: false,
            website: "",
            has_full_profile: false,
            has_fair_partnership: false,
            has_limited_fair_partnership: false,
            profile_layout: "gallery_default",
            display_works_section: true,
            profile_banner_display: null,
            profile_artists_layout: null,
            display_artists_section: true,
          },
          images: [
            {
              id: "603f7e56ebf8da0010cf80b5",
              position: 1,
              aspect_ratio: 1.28,
              downloadable: false,
              original_width: 1500,
              original_height: 1169,
              is_default: true,
              image_url:
                "https://d32dm0rphc51dk.cloudfront.net/yZ2BhxtqkBwaAY5OLj6OUQ/:version.jpg",
              image_versions: [
                "tall",
                "large",
                "small",
                "medium_rectangle",
                "large_rectangle",
                "square",
                "larger",
                "medium",
                "normalized",
              ],
              image_urls: {
                tall:
                  "https://d32dm0rphc51dk.cloudfront.net/yZ2BhxtqkBwaAY5OLj6OUQ/tall.jpg",
                large:
                  "https://d32dm0rphc51dk.cloudfront.net/yZ2BhxtqkBwaAY5OLj6OUQ/large.jpg",
                small:
                  "https://d32dm0rphc51dk.cloudfront.net/yZ2BhxtqkBwaAY5OLj6OUQ/small.jpg",
                medium_rectangle:
                  "https://d32dm0rphc51dk.cloudfront.net/yZ2BhxtqkBwaAY5OLj6OUQ/medium_rectangle.jpg",
                large_rectangle:
                  "https://d32dm0rphc51dk.cloudfront.net/yZ2BhxtqkBwaAY5OLj6OUQ/large_rectangle.jpg",
                square:
                  "https://d32dm0rphc51dk.cloudfront.net/yZ2BhxtqkBwaAY5OLj6OUQ/square.jpg",
                larger:
                  "https://d32dm0rphc51dk.cloudfront.net/yZ2BhxtqkBwaAY5OLj6OUQ/larger.jpg",
                medium:
                  "https://d32dm0rphc51dk.cloudfront.net/yZ2BhxtqkBwaAY5OLj6OUQ/medium.jpg",
                normalized:
                  "https://d32dm0rphc51dk.cloudfront.net/yZ2BhxtqkBwaAY5OLj6OUQ/normalized.jpg",
              },
              tile_size: 512,
              tile_overlap: 0,
              tile_format: "jpg",
              tile_base_url:
                "https://d32dm0rphc51dk.cloudfront.net/yZ2BhxtqkBwaAY5OLj6OUQ/dztiles",
              max_tiled_height: 1169,
              max_tiled_width: 1500,
              gemini_token: "yZ2BhxtqkBwaAY5OLj6OUQ",
              gemini_token_updated_at: null,
            },
          ],
          edition_sets: [],
          cultural_makers: [],
          artists: [
            {
              _id: "4f552b2e3b555241700000f8",
              id: "mario-giacomelli",
              sortable_id: "giacomelli-mario",
              name: "Mario Giacomelli",
              years: "1925-2000",
              public: true,
              birthday: "1925",
              consignable: false,
              deathday: "2000",
              nationality: "Italian",
              published_artworks_count: 237,
              forsale_artworks_count: 79,
              artworks_count: 780,
              original_width: null,
              original_height: null,
              image_url:
                "https://d32dm0rphc51dk.cloudfront.net/8xLzgRMBP-o5Ijb_HIYIPQ/:version.jpg",
              image_versions: ["four_thirds", "large", "square", "tall"],
              image_urls: {
                four_thirds:
                  "https://d32dm0rphc51dk.cloudfront.net/8xLzgRMBP-o5Ijb_HIYIPQ/four_thirds.jpg",
                large:
                  "https://d32dm0rphc51dk.cloudfront.net/8xLzgRMBP-o5Ijb_HIYIPQ/large.jpg",
                square:
                  "https://d32dm0rphc51dk.cloudfront.net/8xLzgRMBP-o5Ijb_HIYIPQ/square.jpg",
                tall:
                  "https://d32dm0rphc51dk.cloudfront.net/8xLzgRMBP-o5Ijb_HIYIPQ/tall.jpg",
              },
              target_supply: true,
            },
          ],
          _id: "6043c5a145cea0000643f141",
          id: "mario-giacomelli-io-non-ho-mani-che-mi-accarezzino-il-volto-22",
          title: "Io non ho mani che mi accarezzino il volto",
          display:
            "Mario Giacomelli, Io non ho mani che mi accarezzino il volto",
          manufacturer: null,
          category: "Photography",
          medium: "Gelatin silver print",
          unique: false,
          forsale: true,
          sold: false,
          date: "",
          dimensions: {
            in: "9 2/5 × 12 1/5 in",
            cm: "24 × 31 cm",
          },
          price: "",
          availability: "for sale",
          availability_hidden: false,
          ecommerce: false,
          offer: false,
          collecting_institution: "",
          blurb: "",
          edition_sets_count: 0,
          published: true,
          private: false,
          price_currency: "USD",
          price_cents: null,
          sale_message: "Contact For Price",
          inquireable: true,
          acquireable: false,
          offerable: false,
          offerable_from_inquiry: false,
          published_at: "2021-03-03T16:44:46+00:00",
          can_share: true,
          can_share_image: true,
          deleted_at: null,
          cultural_maker: null,
          sale_ids: ["6043c59e45cea0000643f139"],
          attribution_class: null,
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
        display_estimate_dollars: null,
        display_high_estimate_dollars: "€2,500",
        display_low_estimate_dollars: "€2,000",
        display_opening_bid_dollars: "€2,000",
        estimate_cents: null,
        high_estimate_cents: 250000,
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
