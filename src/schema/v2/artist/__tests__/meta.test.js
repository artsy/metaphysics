/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("ArtistMeta type", () => {
  let context
  const artist = {
    id: "foo-bar",
    name: "Foo Bar",
    blurb:
      "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.",
  }

  beforeEach(() => {
    context = {
      artistLoader: () => artist,
    }
  })

  it("returns the default title and description", () => {
    const query = `
      {
        artist(id: "foo-bar") {
          meta {
            title
            description
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        artist: {
          meta: {
            title: "Foo Bar - Biography, Shows, Articles & More | Artsy",
            description:
              "Explore Foo Bar’s biography, achievements, artworks, auction results, and shows on Artsy. Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.",
          },
        },
      })
    })
  })

  describe("using the enum values", () => {
    it("returns the correct value for ABOUT", () => {
      const query = `
        {
          artist(id: "foo-bar") {
            meta(page: ABOUT) {
              title
              description
            }
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            meta: {
              title: "Foo Bar - Biography, Shows, Articles & More | Artsy",
              description:
                "Explore Foo Bar’s biography, achievements, artworks, auction results, and shows on Artsy. Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.",
            },
          },
        })
      })
    })

    it("returns the correct value for ARTWORKS", () => {
      const query = `
        {
          artist(id: "foo-bar") {
            meta(page: ARTWORKS) {
              title
              description
            }
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            meta: {
              title: "Foo Bar - Artworks for Sale & More | Artsy",
              description:
                "Discover and purchase Foo Bar’s artworks, available for sale. Browse our selection of paintings, prints, and sculptures by the artist, and find art you love. Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.",
            },
          },
        })
      })
    })

    it("returns the correct value for AUCTION_RESULTS", () => {
      const query = `
        {
          artist(id: "foo-bar") {
            meta(page: AUCTION_RESULTS) {
              title
              description
            }
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            meta: {
              title: "Foo Bar - Auction Results and Sales Data | Artsy",
              description:
                "Find out about Foo Bar’s auction history, past sales, and current market value. Browse Artsy’s Price Database for recent auction results from the artist.",
            },
          },
        })
      })
    })
  })

  it("returns the description without a blurb when it is absent", () => {
    artist.blurb = null
    const query = `
    {
      artist(id: "foo-bar") {
        meta(page: ARTWORKS) {
          description
        }
      }
    }
  `

    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        artist: {
          meta: {
            description:
              "Discover and purchase Foo Bar’s artworks, available for sale. Browse our selection of paintings, prints, and sculptures by the artist, and find art you love.",
          },
        },
      })
    })
  })
})
