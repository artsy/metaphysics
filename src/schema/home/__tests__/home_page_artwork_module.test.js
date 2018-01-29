import schema from "schema"
import { runQuery } from "test/utils"
import gql from "test/gql"

describe("HomePageArtworkModule", () => {
  describe("concerning context", () => {
    it("includes the related artist and artist the suggestion is based on", async () => {
      const query = gql`
        {
          home_page {
            artwork_module(
              key: "related_artists"
              followed_artist_id: "banksy"
              related_artist_id: "rob-pruitt"
            ) {
              context {
                ... on HomePageModuleContextRelatedArtist {
                  artist {
                    id
                  }
                  based_on {
                    id
                  }
                }
              }
            }
          }
        }
      `
      const data = await runQuery(query, {
        artistLoader: id => Promise.resolve({ id }),
      })
      expect(data.home_page.artwork_module.context).toEqual({
        artist: { id: "rob-pruitt" },
        based_on: { id: "banksy" },
      })
    })

    it("includes the followed artist the suggestion is based on", async () => {
      const query = gql`
        {
          home_page {
            artwork_module(
              key: "followed_artist"
              followed_artist_id: "banksy"
            ) {
              context {
                ... on HomePageModuleContextFollowedArtist {
                  artist {
                    id
                  }
                }
              }
            }
          }
        }
      `
      const data = await runQuery(query, {
        artistLoader: id => Promise.resolve({ id }),
      })
      expect(data.home_page.artwork_module.context).toEqual({
        artist: { id: "banksy" },
      })
    })
  })

  describe("when signed out", () => {
    const HomePage = schema.__get__("HomePage")
    const HomePageArtworkModule = HomePage.__get__("HomePageArtworkModule")

    beforeEach(() => {
      const gravity = sinon.stub()
      gravity.with = sinon.stub().returns(gravity)

      HomePageArtworkModule.__Rewire__("gravity", gravity)
    })

    afterEach(() => {
      HomePageArtworkModule.__ResetDependency__("gravity")
    })

    it("returns the proper title for popular_artists", () => {
      const query = gql`
        {
          home_page {
            artwork_module(key: "popular_artists") {
              key
              title
            }
          }
        }
      `
      return runQuery(query).then(({ home_page }) => {
        expect(home_page.artwork_module.title).toEqual(
          "Works by Popular Artists"
        )
      })
    })
  })
})
