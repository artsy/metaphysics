import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

describe("me.myCollectionInfo.collectedArtistsConnection", () => {
  it("returns a connection for the artists in the users' collection", async () => {
    const query = gql`
      {
        me {
          myCollectionInfo {
            collectedArtistsConnection(first: 2) {
              totalCount
              edges {
                artworksCount
                private
                node {
                  name
                }
              }
            }
          }
        }
      }
    `

    const collectionLoader = jest.fn(async () => ({}))
    const meUserInterestsLoader = jest.fn(
      async () => meUserInterestsLoaderResponse
    )
    const collectionArtistsLoader = jest.fn(
      async () => collectionArtistsLoaderResponse
    )
    const meLoader = jest.fn(() => async () => ({
      id: "some-user-id",
    }))

    const context: Partial<ResolverContext> = {
      collectionLoader,
      meLoader,
      collectionArtistsLoader,
      meUserInterestsLoader,
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(data).toMatchInlineSnapshot(`
      Object {
        "me": Object {
          "myCollectionInfo": Object {
            "collectedArtistsConnection": Object {
              "edges": Array [
                Object {
                  "artworksCount": 12,
                  "node": Object {
                    "name": "Yayoi Kusama",
                  },
                  "private": true,
                },
                Object {
                  "artworksCount": 0,
                  "node": Object {
                    "name": "Hilma af Klint",
                  },
                  "private": false,
                },
              ],
              "totalCount": 13,
            },
          },
        },
      }
    `)
  })
})

const collectionArtistsLoaderResponse = {
  headers: { "x-total-count": "1" },
  body: [
    {
      _id: "4d8b92bb4eb68a1b2c00044c",
      artworks_count: 33,
      auction_artworks_count: 0,
      awards: "",
      biennials: "Venice Biennale International Exhibition",
      biography: "",
      birthday: "1862",
      collections: "Moderna Museet, Stockholm ",
      consignable: false,
      created_at: "2016-07-19T16:41:04+00:00",
      critically_acclaimed: true,
      deathday: "1944",
      disable_price_context: true,
      display_auction_link: true,
      display_name: "",
      displayable_partner_shows_count: 4,
      ecommerce_artworks_count: 0,
      education: "",
      first: "Hilma",
      follow_count: 265,
      forsale_artworks_count: 4,
      gender: "female",
      group_indicator: "individual",
      group_show_institutions:
        "Centre Pompidou|Guggenheim Museum Bilbao|Castello di Rivoli|Museum of Old and New Art|Hamburger Bahnhof|Lenbachhaus",
      active_secondary_market: false,
      groupexhibitions: "",
      has_make_offer_artworks: false,
      hometown: "Stockholm, Sweden",
      id: "hilma-af-klint",
      image_url:
        "https://d32dm0rphc51dk.cloudfront.net/qWJmfVvz8XbQJz7cj5I-vg/:version.jpg",
      image_urls: {
        square:
          "https://d32dm0rphc51dk.cloudfront.net/qWJmfVvz8XbQJz7cj5I-vg/square.jpg",
        four_thirds:
          "https://d32dm0rphc51dk.cloudfront.net/qWJmfVvz8XbQJz7cj5I-vg/four_thirds.jpg",
        large:
          "https://d32dm0rphc51dk.cloudfront.net/qWJmfVvz8XbQJz7cj5I-vg/large.jpg",
        tall:
          "https://d32dm0rphc51dk.cloudfront.net/qWJmfVvz8XbQJz7cj5I-vg/tall.jpg",
      },
      image_versions: ["square", "four_thirds", "large", "tall"],
      is_personal_artist: false,
      last: "af Klint",
      location: "Stockholm, Sweden",
      medium_known_for: null,
      middle: "",
      name: "Hilma af Klint",
      nationality: "Swedish",
      original_height: 6727,
      original_width: 5160,
      partner_shows_count: 5,
      public: true,
      publications: "",
      published_artworks_count: 12,
      recent_show: "10/22/2021|ai-guggenheim-bilbao|Group|Women in Abstraction",
      review_sources:
        "Artforum|frieze|The New Yorker|The Guardian|Texte zur Kunst|Art in America|ARTnews|Flash Art|Hyperallergic|4Columns",
      solo_show_institutions:
        "Solomon R. Guggenheim Museum|MoMA PS1|Serpentine Galleries|Louisiana Museum of Art|Hamburger Bahnhof|Neue Nationalgalerie",
      soloexhibitions: "",
      sortable_id: "af-klint-hilma",
      statement: "",
      target_supply: true,
      target_supply_priority: 2,
      target_supply_type: null,
      vanguard_year: null,
      years: "1862-1944",
      residencies: "",
      private_collections: "",
      artworks_count_within_collection: 12,
    },
  ],
}

const meUserInterestsLoaderResponse = {
  headers: { "x-total-count": "13" },
  body: [
    {
      interest: {
        _id: "4d8b92bb4eb68a1b2c00044c",
        artworks_count: 2844,
        birthday: "1929",
        consignable: true,
        created_at: "2010-11-15T16:32:38+00:00",
        critically_acclaimed: true,
        deathday: "",
        forsale_artworks_count: 446,
        group_indicator: "individual",
        id: "yayoi-kusama",
        image_url:
          "https://d32dm0rphc51dk.cloudfront.net/k4jwHwwpU_4Ayulhp8p6qw/:version.jpg",
        image_urls: {
          four_thirds:
            "https://d32dm0rphc51dk.cloudfront.net/k4jwHwwpU_4Ayulhp8p6qw/four_thirds.jpg",
          large:
            "https://d32dm0rphc51dk.cloudfront.net/k4jwHwwpU_4Ayulhp8p6qw/large.jpg",
          square:
            "https://d32dm0rphc51dk.cloudfront.net/k4jwHwwpU_4Ayulhp8p6qw/square.jpg",
          tall:
            "https://d32dm0rphc51dk.cloudfront.net/k4jwHwwpU_4Ayulhp8p6qw/tall.jpg",
        },
        image_versions: ["four_thirds", "large", "square", "tall"],
        is_personal_artist: false,
        medium_known_for: "",
        name: "Yayoi Kusama",
        nationality: "Japanese",
        original_height: 389,
        original_width: 389,
        public: true,
        published_artworks_count: 1647,
        sortable_id: "kusama-yayoi",
        target_supply: true,
        target_supply_priority: 1,
        target_supply_type: "Blue-Chip",
        vanguard_year: null,
        years: "born 1929",
      },
      id: "64ad224bb695fc0008939989",
      created_at: "2023-07-11T09:35:07+00:00",
      updated_at: "2023-07-11T10:02:24+00:00",
      owner_type: "CollectorProfile",
      body: null,
      category: "collected_before",
      private: true,
    },
    {
      interest: {
        _id: "578e58208b3b812f72004475",
        artworks_count: 33,
        birthday: "1862",
        consignable: false,
        created_at: "2016-07-19T16:41:04+00:00",
        critically_acclaimed: true,
        deathday: "1944",
        forsale_artworks_count: 4,
        group_indicator: "individual",
        id: "hilma-af-klint",
        image_url:
          "https://d32dm0rphc51dk.cloudfront.net/qWJmfVvz8XbQJz7cj5I-vg/:version.jpg",
        image_urls: {
          square:
            "https://d32dm0rphc51dk.cloudfront.net/qWJmfVvz8XbQJz7cj5I-vg/square.jpg",
          four_thirds:
            "https://d32dm0rphc51dk.cloudfront.net/qWJmfVvz8XbQJz7cj5I-vg/four_thirds.jpg",
          large:
            "https://d32dm0rphc51dk.cloudfront.net/qWJmfVvz8XbQJz7cj5I-vg/large.jpg",
          tall:
            "https://d32dm0rphc51dk.cloudfront.net/qWJmfVvz8XbQJz7cj5I-vg/tall.jpg",
        },
        image_versions: ["square", "four_thirds", "large", "tall"],
        is_personal_artist: false,
        medium_known_for: null,
        name: "Hilma af Klint",
        nationality: "Swedish",
        original_height: 6727,
        original_width: 5160,
        public: true,
        published_artworks_count: 12,
        sortable_id: "af-klint-hilma",
        target_supply: true,
        target_supply_priority: 2,
        target_supply_type: null,
        vanguard_year: null,
        years: "1862-1944",
      },
      id: "64ad224bb695fc000893998a",
      created_at: "2023-07-11T09:35:07+00:00",
      updated_at: "2023-07-11T10:02:29+00:00",
      owner_type: "CollectorProfile",
      body: null,
      category: "collected_before",
      private: false,
    },
  ],
}
