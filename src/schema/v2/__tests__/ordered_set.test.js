import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("OrderedSet type", () => {
  it("fetches set by id", async () => {
    const query = gql`
      {
        orderedSet(id: "52dd3c2e4b8480091700027f") {
          internalID
          name
          key
          description
          artworks: items {
            ... on Artwork {
              title
            }
          }
        }
      }
    `

    const context = {
      setLoader: jest.fn(() =>
        Promise.resolve({
          description: "",
          id: "52dd3c2e4b8480091700027f",
          item_type: "Artwork",
          key: "artworks:featured-artworks",
          name: "Featured Artworks",
        })
      ),
      setItemsLoader: jest.fn(() =>
        Promise.resolve({
          body: [
            createArtworkFixture({ title: "My Artwork" }),
            createArtworkFixture({ title: "Another Artwork" }),
          ],
          headers: {},
        })
      ),
    }

    const data = await runQuery(query, context)

    expect(data).toEqual({
      orderedSet: {
        internalID: "52dd3c2e4b8480091700027f",
        name: "Featured Artworks",
        description: null,
        key: "artworks:featured-artworks",
        artworks: [
          {
            title: "My Artwork",
          },
          {
            title: "Another Artwork",
          },
        ],
      },
    })
  })

  it("can return a connection for an artwork set", async () => {
    const query = gql`
      {
        orderedSet(id: "52dd3c2e4b8480091700027f") {
          orderedItemsConnection(first: 2) {
            edges {
              node {
                ... on Artwork {
                  title
                }
              }
            }
          }
        }
      }
    `

    const context = {
      setLoader: jest.fn(() =>
        Promise.resolve({
          description: "",
          id: "52dd3c2e4b8480091700027f",
          item_type: "Artwork",
          key: "artworks:featured-artworks",
          name: "Featured Artworks",
        })
      ),
      setItemsLoader: jest.fn(() =>
        Promise.resolve({
          body: [
            createArtworkFixture({ title: "My Artwork" }),
            createArtworkFixture({
              _id: "artwork-2",
              id: "artwork-slug-2",
              title: "Another Artwork",
            }),
          ],
          headers: {
            "x-total-count": 11,
          },
        })
      ),
    }

    const data = await runQuery(query, context)

    expect(data).toEqual({
      orderedSet: {
        orderedItemsConnection: {
          edges: [
            {
              node: {
                title: "My Artwork",
              },
            },
            {
              node: {
                title: "Another Artwork",
              },
            },
          ],
        },
      },
    })
  })
})

/**
 * Detailed artwork fixture required because of the runtypes checking in the
 * `orderedItemsConnection` resolver
 *
 * @see src/types/runtime/gravity/Artwork.ts
 * @see src/schema/v2/OrderedSet/OrderedSet.ts
 */
function createArtworkFixture(overrides = {}) {
  return {
    _id: "artwork-1",
    id: "artwork-slug-1",
    access: undefined,
    acquireable: false,
    additional_information: "",
    attribution_class: null,
    artist: null,
    artists: [],
    availability: "for sale",
    blurb: "",
    can_share_image: true,
    can_share: true,
    category: "Painting",
    certificate_of_authenticity: null,
    collecting_institution: "",
    comparables_count: 0,
    condition_description: null,
    cultural_maker: null,
    cultural_makers: [],
    current_version_id: null,
    date: "2023",
    default_image_id: null,
    deleted_at: null,
    depth_cm: null,
    depth: null,
    diameter_cm: null,
    diameter: null,
    dimensions: { in: null, cm: null },
    display: "",
    domestic_shipping_fee_cents: null,
    duration: null,
    ecommerce: false,
    edition_sets: [],
    edition_sets_count: 0,
    eu_shipping_origin: false,
    exhibition_history: "",
    feature_eligible: false,
    forsale: true,
    framed: null,
    height_cm: null,
    height: null,
    images: [],
    image_rights: "",
    inquireable: false,
    international_shipping_fee_cents: null,
    last_saved_at: null,
    literature: "",
    manufacturer: null,
    medium: "Oil on canvas",
    metric: null,
    not_signed: null,
    offer: false,
    offerable: false,
    offerable_from_inquiry: false,
    partner: {
      partner_categories: [],
      _id: "partner-1",
      id: "partner-slug-1",
      default_profile_id: "profile-1",
      default_profile_public: true,
      sortable_id: "partner-1",
      type: "Gallery",
      name: "Test Gallery",
      short_name: null,
      pre_qualify: false,
      website: "",
      has_full_profile: true,
      has_fair_partnership: false,
      profile_layout: "default",
      display_works_section: true,
      profile_banner_display: null,
      profile_artists_layout: null,
      display_artists_section: true,
    },
    pickup_available: null,
    price_cents: null,
    price_currency: null,
    price_hidden: false,
    price_includes_tax: false,
    price: "",
    private_shortcut_path: null,
    provenance: "",
    published_at: "2023-01-01T00:00:00Z",
    published: true,
    publisher: null,
    relevant_auction_results: "",
    recent_saves_count: null,
    sale_ids: [],
    sale_message: null,
    series: null,
    shipping_origin: null,
    signature: "",
    signed_by_artist: null,
    signed_in_plate: null,
    signed_other: null,
    size_score: null,
    sold: false,
    stamped_by_artist_estate: null,
    sticker_label: null,
    tags: [],
    title: "My Artwork",
    unique: false,
    website: "",
    width_cm: null,
    width: null,
    ...overrides,
  }
}
