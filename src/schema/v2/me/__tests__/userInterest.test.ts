import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

describe("me.userInterest", () => {
  it("returns user interest", async () => {
    const query = gql`
      {
        me {
          userInterest(id: "user-interest-id") {
            internalID
            interest {
              __typename
              ... on Artist {
                internalID
              }
            }
          }
        }
      }
    `
    const meUserInterestLoader = jest.fn(async () => userInterestResponse)
    const meLoader = jest.fn(async () => ({ id: "some-user-id" }))

    const context: Partial<ResolverContext> = {
      meUserInterestLoader,
      meLoader,
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(meLoader).toHaveBeenCalled()
    expect(meUserInterestLoader).toHaveBeenCalledWith("user-interest-id")

    expect(data).toMatchInlineSnapshot(`
      Object {
        "me": Object {
          "userInterest": Object {
            "interest": Object {
              "__typename": "Artist",
              "internalID": "artist-id",
            },
            "internalID": "user-interest-id",
          },
        },
      }
    `)
  })
})

const userInterestResponse = {
  interest: {
    _id: "artist-id",
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
  id: "user-interest-id",
  created_at: "2023-07-11T09:35:07+00:00",
  updated_at: "2023-07-11T10:02:24+00:00",
  owner_type: "CollectorProfile",
  body: null,
  category: "collected_before",
  private: false,
}
