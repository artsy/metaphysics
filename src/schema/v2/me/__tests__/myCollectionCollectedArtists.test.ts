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
        blurb:
          "Yayoi Kusama dazzles audiences worldwide with her immersive “Infinity Mirror Rooms” and an aesthetic that embraces light, polka dots, and pumpkins. The avant-garde artist first rose to prominence in 1960s New York, where she staged provocative [Happenings](https://www.artsy.net/gene/happenings) and exhibited hallucinatory paintings of loops and [dots](https://www.artsy.net/artist-series/yayoi-kusama-polka-dots) that she called “[Infinity Nets](https://www.artsy.net/artist-series/yayoi-kusama-infinity-nets).” Kusama also influenced [Andy Warhol](https://www.artsy.net/artist/andy-warhol) and augured the rise of feminist and [Pop art](https://www.artsy.net/gene/pop-art). She has been the subject of major exhibitions at the [Museum of Modern Art](https://www.artsy.net/museum-of-modern-art), [Centre Pompidou](https://www.artsy.net/centrepompidou), [Tate Modern](https://www.artsy.net/tate), and the [National Museum of Modern Art in Tokyo](https://www.artsy.net/the-national-museum-of-modern-art-tokyo). In 1993, Kusama represented Japan at the Venice Biennale. Today, her work regularly sells for seven figures on the secondary market. Throughout her disparate practice, Kusama has continued to explore her own obsessive-compulsive disorder, sexuality, freedom, and perception. In 1977, Kusama voluntarily checked herself into a psychiatric hospital in Tokyo, where she continues to live today. ",
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
        blurb:
          "A groundbreaking pioneer of [abstract art](https://www.artsy.net/gene/abstract-art), Hilma af Klint created [esoteric, mystical paintings](https://www.artsy.net/artist/hilma-af-klint) that have found a wide audience since being repopularized in the 21st century. Trained at the Royal Swedish Academy of Fine Arts, the Stockholm-born artist developed her visual language before other abstract artists of her time, including [Wassily Kandinsky](https://www.artsy.net/artist/wassily-kandinsky), [Kasimir Malevich](https://www.artsy.net/artist/kasimir-severinovich-malevich), and [Piet Mondrian](https://www.artsy.net/artist/piet-mondrian). Klint achieved fame long after them, in part because she wanted her works kept private until after her death. Her cosmic paintings made their international debut in 1986, touring from Los Angeles to the Hague, and Stockholm’s Moderna Museet staged a major retrospective of 230 paintings in 2013. The artist’s renown has only grown: A 2018–2019 [Guggenheim Museum ](https://www.artsy.net/partner/guggenheim-museum)show broke attendance records for the museum, attracting more than 600,000 visitors. Often monumental, as exemplified by her striking series “[The Ten Largest](https://www.artsy.net/artwork/hilma-af-klint-group-iv-the-ten-largest-no-7-adulthood-grupp-iv-de-tio-storsta-nr-7-mannaaldern-from-untitled-series),” af Klint’s paintings are filled with biomorphic and [geometric](https://www.artsy.net/gene/geometric) forms that translate her understanding of an unseen but palpable spiritual world.",
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
