/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("newWorksByInterestingArtists", () => {
  const query = gql`
    {
      me {
        newWorksByInterestingArtists(first: 100) {
          totalCount
          edges {
            node {
              internalID
              slug
              id
            }
          }
        }
      }
    }
  `

  it("returns works by artists the user interacted with", async () => {
    const vortexGraphqlLoader = jest.fn(() => async () => mockVortexResponse)

    const artworksLoader = jest.fn(async () => mockArtworksResponse)

    const context = {
      meLoader: () => Promise.resolve({}),
      vortexGraphqlLoader,
      artworksLoader,
    }

    const {
      me: { newWorksByInterestingArtists },
    } = await runAuthenticatedQuery(query, context)

    expect(newWorksByInterestingArtists).toMatchInlineSnapshot(`
      Object {
        "edges": Array [
          Object {
            "node": Object {
              "id": "QXJ0d29yazo2MDhhNzQxOGJkZmJkMWE3ODliYTA5NmI=",
              "internalID": "608a7418bdfbd1a789ba096b",
              "slug": "yayoi-kusama-pumpkin-green",
            },
          },
        ],
        "totalCount": 100,
      }
    `)

    expect(vortexGraphqlLoader).toHaveBeenCalledWith({
      query: gql`
        query artistAffinitiesQuery {
          artistAffinities(first: 50, minScore: 0.5) {
            totalCount
            edges {
              node {
                artistId
                score
              }
            }
          }
        }
      `,
    })
    expect(artworksLoader).toHaveBeenCalledWith({
      artist_ids: ["608a7417bdfbd1a789ba092a", "608a7416bdfbd1a789ba0911"],
      availability: "for sale",
      offset: 0,
      size: 100,
      sort: "-published_at",
    })
  })

  it("doesn't return works if user hasn't interacted with any artists", async () => {
    const vortexGraphqlLoader = jest.fn(() => async () => ({
      data: {
        artistAffinities: {
          totalCount: 0,
          edges: [],
        },
      },
    }))

    const artworksLoader = jest.fn(async () => mockArtworksResponse)

    const context = {
      meLoader: () => Promise.resolve({}),
      vortexGraphqlLoader,
      artworksLoader,
    }

    const {
      me: { newWorksByInterestingArtists },
    } = await runAuthenticatedQuery(query, context)

    expect(newWorksByInterestingArtists).toMatchInlineSnapshot(`
      Object {
        "edges": Array [],
        "totalCount": 0,
      }
    `)

    expect(vortexGraphqlLoader).toHaveBeenCalled()
    expect(artworksLoader).not.toHaveBeenCalled()
  })
})

const mockVortexResponse = {
  data: {
    artistAffinities: {
      totalCount: 2,
      edges: [
        {
          node: {
            artistId: "608a7417bdfbd1a789ba092a",
            score: 3.422242962512335,
          },
        },
        {
          node: {
            artistId: "608a7416bdfbd1a789ba0911",
            score: 3.2225049587839654,
          },
        },
      ],
    },
  },
}

const mockArtworksResponse = [
  {
    artist: {
      _id: "608a7417bdfbd1a789ba092a",
      artworks_count: 3,
      birthday: "",
      blurb: "",
      consignable: false,
      deathday: "",
      forsale_artworks_count: 2,
      group_indicator: "individual",
      id: "yayoi-kusama",
      image_url: null,
      image_urls: {},
      image_versions: [],
      medium_known_for: null,
      name: "Yayoi Kusama",
      nationality: "",
      original_height: null,
      original_width: null,
      public: true,
      published_artworks_count: 3,
      sortable_id: "kusama-yayoi",
      target_supply: false,
      target_supply_priority: null,
      target_supply_type: null,
      years: "",
    },
    partner: {
      partner_categories: [],
      _id: "608a7415bdfbd1a789ba08f0",
      id: "gallery-partner-test",
      default_profile_id: "gallery-partner-test",
      default_profile_public: true,
      sortable_id: "partner-test",
      type: "Gallery",
      name: "Gallery Partner Test",
      short_name: null,
      pre_qualify: false,
      website: "",
      has_full_profile: false,
      has_fair_partnership: false,
      profile_layout: "gallery_default",
      display_works_section: true,
      profile_banner_display: null,
      profile_artists_layout: null,
      display_artists_section: true,
    },
    images: [],
    edition_sets: [],
    cultural_makers: [],
    artists: [
      {
        _id: "608a7417bdfbd1a789ba092a",
        artworks_count: 3,
        birthday: "",
        blurb: "",
        consignable: false,
        deathday: "",
        forsale_artworks_count: 2,
        group_indicator: "individual",
        id: "yayoi-kusama",
        image_url: null,
        image_urls: {},
        image_versions: [],
        medium_known_for: null,
        name: "Yayoi Kusama",
        nationality: "",
        original_height: null,
        original_width: null,
        public: true,
        published_artworks_count: 3,
        sortable_id: "kusama-yayoi",
        target_supply: false,
        target_supply_priority: null,
        target_supply_type: null,
        years: "",
      },
    ],
    _id: "608a7418bdfbd1a789ba096b",
    id: "yayoi-kusama-pumpkin-green",
    title: "Pumpkin (Green)",
    display: "Yayoi Kusama, Pumpkin (Green)",
    manufacturer: null,
    category: "",
    medium: "",
    unique: false,
    forsale: false,
    sold: true,
    date: "",
    dimensions: {
      in: null,
      cm: null,
    },
    price: "",
    series: "",
    availability: "sold",
    availability_hidden: false,
    ecommerce: false,
    offer: false,
    tags: ["Pumpkin"],
    width: null,
    height: null,
    depth: null,
    diameter: null,
    width_cm: null,
    height_cm: null,
    depth_cm: null,
    diameter_cm: null,
    metric: "in",
    size_score: null,
    size_bucket: "small",
    duration: null,
    website: "",
    signature: "",
    default_image_id: null,
    provenance: "",
    literature: "",
    exhibition_history: "",
    collecting_institution: "",
    additional_information: "",
    image_rights: "",
    relevant_auction_results: "",
    blurb: "",
    price_hidden: false,
    edition_sets_count: 0,
    published: true,
    private: false,
    feature_eligible: false,
    price_currency: "USD",
    price_includes_tax: false,
    price_cents: null,
    sale_message: "Sold",
    inquireable: false,
    acquireable: false,
    offerable: false,
    offerable_from_inquiry: false,
    published_at: "2021-04-29T08:53:44+00:00",
    can_share: true,
    can_share_image: true,
    deleted_at: null,
    publisher: "",
    comparables_count: 0,
    cultural_maker: null,
    sale_ids: [],
    attribution_class: null,
    framed: null,
    certificate_of_authenticity: null,
    coa_by_authenticating_body: null,
    coa_by_gallery: null,
    condition_description: null,
    signed_by_artist: null,
    stamped_by_artist_estate: null,
    sticker_label: null,
    signed_in_plate: null,
    signed_other: null,
    not_signed: null,
    pickup_available: null,
    domestic_shipping_fee_cents: null,
    international_shipping_fee_cents: null,
    shipping_origin: null,
    eu_shipping_origin: false,
    current_version_id: null,
    unlisted: false,
    featured_slot: null,
    artsy_shipping_domestic: false,
  },
]
