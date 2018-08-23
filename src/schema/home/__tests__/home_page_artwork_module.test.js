/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"
import gql from "lib/gql"

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
          "Works by popular artists"
        )
      })
    })
  })
})
