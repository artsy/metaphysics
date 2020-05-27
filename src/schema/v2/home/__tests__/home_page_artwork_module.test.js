/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("HomePageArtworkModule", () => {
  describe("concerning context", () => {
    it("includes the related artist and artist the suggestion is based on", async () => {
      const query = gql`
        {
          homePage {
            artworkModule(
              key: "related_artists"
              followedArtistID: "banksy"
              relatedArtistID: "rob-pruitt"
            ) {
              context {
                ... on HomePageRelatedArtistArtworkModule {
                  artist {
                    slug
                  }
                  basedOn {
                    slug
                  }
                }
              }
            }
          }
        }
      `
      const data = await runQuery(query, {
        artistLoader: (id) => Promise.resolve({ id }),
      })
      expect(data.homePage.artworkModule.context).toEqual({
        artist: { slug: "rob-pruitt" },
        basedOn: { slug: "banksy" },
      })
    })

    it("includes the followed artist the suggestion is based on", async () => {
      const query = gql`
        {
          homePage {
            artworkModule(key: "followed_artist", followedArtistID: "banksy") {
              context {
                ... on HomePageFollowedArtistArtworkModule {
                  artist {
                    slug
                  }
                }
              }
            }
          }
        }
      `
      const data = await runQuery(query, {
        artistLoader: (id) => Promise.resolve({ id }),
      })
      expect(data.homePage.artworkModule.context).toEqual({
        artist: { slug: "banksy" },
      })
    })
  })

  describe("genes", () => {
    it("fetches the gene and results if an id is provided", async () => {
      const query = gql`
        {
          homePage {
            artworkModule(key: "genes", id: "catty-art") {
              results {
                slug
              }
            }
          }
        }
      `
      const data = await runQuery(query, {
        geneLoader: (id) => Promise.resolve({ id }),
        filterArtworksLoader: () =>
          Promise.resolve({ hits: [{ id: "catty-art-work" }] }),
      })
      expect(data.homePage.artworkModule.results).toEqual([
        { slug: "catty-art-work" },
      ])
    })
  })

  it("fetches a followed gene and results without an id", async () => {
    const query = gql`
      {
        homePage {
          artworkModule(key: "genes") {
            results {
              slug
            }
          }
        }
      }
    `
    const data = await runQuery(query, {
      followedGenesLoader: () =>
        Promise.resolve({ body: [{ gene: { id: "catty-art" } }] }),
      filterArtworksLoader: () =>
        Promise.resolve({ hits: [{ id: "catty-art-work" }] }),
    })
    expect(data.homePage.artworkModule.results).toEqual([
      { slug: "catty-art-work" },
    ])
  })

  describe("when signed out", () => {
    it("returns the proper title for popular_artists", () => {
      const query = gql`
        {
          homePage {
            artworkModule(key: "popular_artists") {
              key
              title
            }
          }
        }
      `
      return runQuery(query).then(({ homePage }) => {
        expect(homePage.artworkModule.title).toEqual("Works by Popular Artists")
      })
    })
  })
})
