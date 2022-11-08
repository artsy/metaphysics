/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("Artist type", () => {
  let artist = null
  let context

  beforeEach(() => {
    context = {
      artistLoader: () => artist,
      articlesLoader: () => Promise.resolve({ count: 22 }),
      auctionLotsLoader: () => Promise.resolve({ total_count: 123 }),
      artistGenesLoader: () => Promise.resolve([{ name: "Foo Bar" }]),
      relatedMainArtistsLoader: () =>
        Promise.resolve({ headers: { "x-total-count": 42 } }),
    }

    artist = {
      id: "foo-bar",
      name: "Foo Bar",
      bio: null,
      blurb: null,
      birthday: null,
      artworks_count: 42,
      partner_shows_count: 42,
      collections: "Catty Art Collections\nMatt's Personal Art Collection",
    }
  })

  it("returns null for an empty ID string", () => {
    return runQuery(`{ artist(id: "") { slug } }`, context).then((data) => {
      expect(data.artist).toBe(null)
    })
  })

  it("fetches an artist by ID", () => {
    return runQuery(`{ artist(id: "foo-bar") { slug, name } }`, context).then(
      (data) => {
        expect(data.artist.slug).toBe("foo-bar")
        expect(data.artist.name).toBe("Foo Bar")
      }
    )
  })

  it("returns the total number of partner shows for an artist", () => {
    const query = `
      {
        artist(id: "foo-bar") {
          counts {
            partnerShows
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        artist: {
          counts: {
            partnerShows: 42,
          },
        },
      })
    })
  })

  it("returns the total number of related artists for an artist", () => {
    const query = `
      {
        artist(id: "foo-bar") {
          counts {
            relatedArtists
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        artist: {
          counts: {
            relatedArtists: 42,
          },
        },
      })
    })
  })

  it("returns the total number of related articles for an artist", () => {
    const query = `
      {
        artist(id: "foo-bar") {
          counts {
            articles
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        artist: {
          counts: {
            articles: 22,
          },
        },
      })
    })
  })

  it("returns the number of auction results for an artist", () => {
    const query = `
      {
        artist(id: "foo-bar") {
          counts {
            auctionResults
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        artist: {
          counts: {
            auctionResults: 123,
          },
        },
      })
    })
  })

  it("returns false if artist has no metadata", () => {
    const query = `
      {
        artist(id: "foo-bar") {
          hasMetadata
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        artist: {
          hasMetadata: false,
        },
      })
    })
  })

  it("includes collections data", () => {
    const query = `
      {
        artist(id: "foo-bar") {
          collections
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data).toEqual({
        artist: {
          collections: [
            "Catty Art Collections",
            "Matt's Personal Art Collection",
          ],
        },
      })
    })
  })

  describe("when formatting nationality and birthday string", () => {
    it("replaces born with b.", () => {
      artist.birthday = "Born 2000"

      const query = `
        {
          artist(id: "foo-bar") {
            formattedNationalityAndBirthday
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            formattedNationalityAndBirthday: "b. 2000",
          },
        })
      })
    })

    it("adds b. to birthday if only a date is provided", () => {
      artist.birthday = "2000"

      const query = `
        {
          artist(id: "foo-bar") {
            formattedNationalityAndBirthday
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            formattedNationalityAndBirthday: "b. 2000",
          },
        })
      })
    })

    it("does not change birthday if birthday contains Est.", () => {
      artist.birthday = "Est. 2000"

      const query = `
        {
          artist(id: "foo-bar") {
            formattedNationalityAndBirthday
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            formattedNationalityAndBirthday: "Est. 2000",
          },
        })
      })
    })

    it("returns both if both are provided", () => {
      artist.birthday = "2000"
      artist.nationality = "Martian"

      const query = `
        {
          artist(id: "foo-bar") {
            formattedNationalityAndBirthday
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            formattedNationalityAndBirthday: "Martian, b. 2000",
          },
        })
      })
    })

    it("returns only nationality if no birthday is provided", () => {
      artist.nationality = "Martian"

      const query = `
        {
          artist(id: "foo-bar") {
            formattedNationalityAndBirthday
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            formattedNationalityAndBirthday: "Martian",
          },
        })
      })
    })

    it("returns birthday-deathday if deathday is present", () => {
      artist.nationality = "Martian"
      artist.birthday = "2000"
      artist.deathday = "2012"

      const query = `
        {
          artist(id: "foo-bar") {
            formattedNationalityAndBirthday
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            formattedNationalityAndBirthday: "Martian, 2000–2012",
          },
        })
      })
    })
    it("returns null if neither birthday, deathday, nor nationality are provided", () => {
      const query = `
        {
          artist(id: "foo-bar") {
            formattedNationalityAndBirthday
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            formattedNationalityAndBirthday: null,
          },
        })
      })
    })
    it("returns null if neither birthday nor nationality are provided", () => {
      artist.deathday = "2016"
      const query = `
        {
          artist(id: "foo-bar") {
            formattedNationalityAndBirthday
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            formattedNationalityAndBirthday: null,
          },
        })
      })
    })
  })
  describe("artworksConnection", () => {
    beforeEach(() => {
      const count = 20
      artist.published_artworks_count = count
      artist.forsale_artworks_count = count
      const artworks = Promise.resolve(Array(count))
      context.artistArtworksLoader = sinon
        .stub()
        .withArgs(artist.id)
        .returns(artworks)
    })
    it("does not have a next page when the requested amount exceeds the count", () => {
      const query = `
        {
          artist(id: "foo-bar") {
            artworksConnection(first: 40) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            artworksConnection: {
              pageInfo: {
                hasNextPage: false,
              },
            },
          },
        })
      })
    })
    it("does not have a next page when the requested amount exceeds the count (w/ filter)", () => {
      const query = `
        {
          artist(id: "foo-bar") {
            artworksConnection(first: 20, filter: IS_FOR_SALE) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            artworksConnection: {
              pageInfo: {
                hasNextPage: false,
              },
            },
          },
        })
      })
    })
    it("has a next page when the amount requested is less than the count", () => {
      const query = `
        {
          artist(id: "foo-bar") {
            artworksConnection(first: 10, filter: IS_FOR_SALE) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            artworksConnection: {
              pageInfo: {
                hasNextPage: true,
              },
            },
          },
        })
      })
    })
  })
  describe("biographyBlurb", () => {
    it("returns the blurb if present", () => {
      artist.blurb = "catty blurb"
      const query = `
        {
          artist(id: "foo-bar") {
            blurb
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            blurb: "catty blurb",
          },
        })
      })
    })
  })
  describe("biographyBlurb", () => {
    describe("with partnerBio set to true", () => {
      describe("with a featured partner bio", () => {
        beforeEach(() => {
          const partnerArtists = Promise.resolve([
            {
              biography: "new catty bio",
              partner: {
                name: "Catty Partner",
                id: "catty-partner",
              },
            },
          ])
          context.partnerArtistsForArtistLoader = sinon
            .stub()
            .withArgs(artist.id)
            .returns(partnerArtists)
        })
        afterEach(() => {
          const query = `
            {
              artist(id: "foo-bar") {
                biographyBlurb(partnerBio: true, format: HTML) {
                  text
                  credit
                  partnerID
                }
              }
            }
          `
          return runQuery(query, context).then((data) => {
            expect(data).toEqual({
              artist: {
                biographyBlurb: {
                  text: "<p>new catty bio</p>\n",
                  credit: "Submitted by Catty Partner",
                  partnerID: "catty-partner",
                },
              },
            })
          })
        })
        it("returns the featured partner bio without an artsy blurb", () => {})
        it("returns the featured partner bio with an artsy blurb", () => {
          artist.blurb = "artsy blurb"
        })
      })
      describe("without a featured partner bio", () => {
        it("returns the artsy blurb if there is no featured partner bio", () => {
          context.partnerArtistsForArtistLoader = sinon
            .stub()
            .returns(Promise.resolve([]))
          artist.blurb = "artsy blurb"
          const query = `
            {
              artist(id: "foo-bar") {
                biographyBlurb(partnerBio: true) {
                  text
                  credit
                  partnerID
                }
              }
            }
          `
          return runQuery(query, context).then((data) => {
            expect(data).toEqual({
              artist: {
                biographyBlurb: {
                  text: "artsy blurb",
                  credit: null,
                  partnerID: null,
                },
              },
            })
          })
        })
      })
    })
    it("returns the blurb if present", () => {
      artist.blurb = "catty blurb"
      const query = `
        {
          artist(id: "foo-bar") {
            biographyBlurb {
              text
              credit
              partnerID
            }
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            biographyBlurb: {
              text: "catty blurb",
              credit: null,
              partnerID: null,
            },
          },
        })
      })
    })
    it("returns the featured bio if there is no Artsy one", () => {
      const partnerArtists = Promise.resolve([
        {
          biography: "new catty bio",
          partner: {
            name: "Catty Partner",
            id: "catty-partner",
          },
        },
      ])
      context.partnerArtistsForArtistLoader = sinon
        .stub()
        .withArgs(artist.id)
        .returns(partnerArtists)
      const query = `
        {
          artist(id: "foo-bar") {
            biographyBlurb {
              text
              credit
              partnerID
            }
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            biographyBlurb: {
              text: "new catty bio",
              credit: "Submitted by Catty Partner",
              partnerID: "catty-partner",
            },
          },
        })
      })
    })
  })
  describe("concerning related shows", () => {
    beforeEach(() => {
      const partnerlessShow = {
        id: "no-partner",
        is_reference: true,
        display_on_partner_profile: false,
      }
      const galaxyShow = {
        id: "galaxy-partner",
        is_reference: true,
        display_on_partner_profile: false,
        galaxy_partner_id: "420",
      }
      const privateShow = {
        id: "oops",
        partner: {
          type: "Private Dealer",
          has_full_profile: true,
          profile_banner_display: false,
        },
        is_reference: true,
        display_on_partner_profile: false,
      }
      const publicShow = {
        id: "ok",
        partner: {
          type: "Gallery",
          has_full_profile: true,
          profile_banner_display: false,
        },
        is_reference: true,
        display_on_partner_profile: false,
      }
      context.relatedShowsLoader = sinon
        .stub()
        .withArgs(artist.id)
        .returns(
          Promise.resolve({
            body: [privateShow, publicShow, partnerlessShow, galaxyShow],
          })
        )
    })
    // FIXME: Isn't returning the expected values... Might be a bug
    it.skip("excludes shows from private partners for related shows", () => {
      const query = `
        {
          artist(id: "foo-bar") {
            showsConnection(first: 10) {
              edges {
                node {
                  slug
                }
              }
            }
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            edges: [
              {
                slug: "ok",
              },
              {
                slug: "galaxy-partner",
              },
            ],
          },
        })
      })
    })
    it("excludes shows from private partners for exhibition highlights", () => {
      const query = `
        {
          artist(id: "foo-bar") {
            exhibitionHighlights {
              slug
            }
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            exhibitionHighlights: [
              {
                slug: "ok",
              },
              {
                slug: "galaxy-partner",
              },
            ],
          },
        })
      })
    })
  })
  describe("concerning works count", () => {
    it("returns a formatted description including works for sale", () => {
      artist.published_artworks_count = 42
      artist.forsale_artworks_count = 21
      const query = `
        {
          artist(id: "foo-bar") {
            formattedArtworksCount
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            formattedArtworksCount: "42 works, 21 for sale",
          },
        })
      })
    })
    it("returns only works if none are for sale", () => {
      artist.published_artworks_count = 42
      artist.forsale_artworks_count = 0
      const query = `
        {
          artist(id: "foo-bar") {
            formattedArtworksCount
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            formattedArtworksCount: "42 works",
          },
        })
      })
    })
    it("returns null when there are no works", () => {
      artist.published_artworks_count = 0
      artist.forsale_artworks_count = 0
      const query = `
        {
          artist(id: "foo-bar") {
            formattedArtworksCount
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            formattedArtworksCount: null,
          },
        })
      })
    })
    it("returns a singular string if only one work for sale", () => {
      artist.published_artworks_count = 1
      artist.forsale_artworks_count = 0
      const query = `
        {
          artist(id: "foo-bar") {
            formattedArtworksCount
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            formattedArtworksCount: "1 work",
          },
        })
      })
    })
  })

  describe("genes", () => {
    it("returns an array of assosciated genes", () => {
      const query = `
        {
          artist(id: "foo-bar") {
            genes {
              name
            }
          }
        }
      `
      return runQuery(query, context).then((data) => {
        expect(data).toEqual({
          artist: {
            genes: [{ name: "Foo Bar" }],
          },
        })
      })
    })
  })

  describe("filtered artworks", () => {
    it("returns filtered artworks", () => {
      const filterArtworksLoader = jest.fn().mockReturnValueOnce(
        Promise.resolve({
          hits: [
            {
              _id: "im-a-cat",
              title: "I'm a cat",
              artists: ["percy"],
            },
          ],
          aggregations: { total: { value: 75 } },
        })
      )
      context.unauthenticatedLoaders = { filterArtworksLoader }
      context.authenticatedLoaders = {}

      const query = `
        {
          artist(id: "percy") {
            filterArtworksConnection(aggregations:[TOTAL], partnerID: null, first: 10){
              edges {
                node {
                  internalID
                  title
                }
              }
            }
          }
        }
      `

      return runQuery(query, context).then((data) => {
        expect(filterArtworksLoader.mock.calls[0][0]).not.toHaveProperty(
          "partnerID"
        )
        expect(data).toMatchInlineSnapshot(`
          Object {
            "artist": Object {
              "filterArtworksConnection": Object {
                "edges": Array [
                  Object {
                    "node": Object {
                      "internalID": "im-a-cat",
                      "title": "I'm a cat",
                    },
                  },
                ],
              },
            },
          }
        `)
      })
    })
  })

  describe("articlesConnection", () => {
    it("returns connection of articles augmented by cursor info", () => {
      const articlesLoader = jest.fn().mockReturnValueOnce(
        Promise.resolve({
          results: [
            {
              id: "foo-bar",
              slug: "foo-bar",
              title: "My Awesome Article",
            },
          ],
          count: 35,
        })
      )
      context.articlesLoader = articlesLoader

      const query = `
        {
          artist(id: "percy") {
            articlesConnection(first: 10, after: "YXJyYXljb25uZWN0aW9uOjk=") {
              pageCursors {
                first {
                  page
                }
                around {
                  page
                }
                last {
                  page
                }
              }
              edges {
                node {
                  title
                }
              }
              pageInfo {
                startCursor
                hasNextPage
                hasPreviousPage
              }
            }
          }
        }
      `

      return runQuery(query, context).then(
        ({
          artist: {
            articlesConnection: {
              pageInfo: { startCursor, hasNextPage },
              pageCursors,
              edges,
            },
          },
        }) => {
          // Check expected page cursors exist in response.
          const { first, around, last } = pageCursors
          expect(first).toEqual(null)
          expect(last).toEqual(null)
          expect(around.length).toEqual(4)
          let index
          for (index = 0; index < 4; index++) {
            expect(around[index].page).toBe(index + 1)
          }
          // Check article data included in edges.
          expect(edges[0].node.title).toEqual("My Awesome Article")
          // Check next are true.
          expect(hasNextPage).toBe(true)
          expect(startCursor).not.toBe(null)
        }
      )
    })
  })

  describe("showsConnection", () => {
    it("returns connection of shows augmented by cursor and pagination info", () => {
      const relatedShowsLoader = jest.fn().mockReturnValueOnce(
        Promise.resolve({
          body: [
            {
              id: "foo-bar",
              name: "Catty Art Show",
              partner: {
                type: "Gallery",
              },
            },
            {
              id: "oops",
              name: "Private Dealer Art Show",
              partner: {
                type: "Private Dealer",
              },
            },
          ],
          headers: { "x-total-count": 35 },
        })
      )
      context.relatedShowsLoader = relatedShowsLoader

      const query = `
        {
          artist(id: "percy") {
            showsConnection(first: 10, after: "YXJyYXljb25uZWN0aW9uOjk=") {
              pageCursors {
                first {
                  page
                }
                around {
                  page
                }
                last {
                  page
                }
              }
              pageInfo {
                hasNextPage
              }
              totalCount
              edges {
                node {
                  name
                }
              }
            }
          }
        }
      `

      return runQuery(query, context).then(
        ({
          artist: {
            showsConnection: {
              pageInfo: { hasNextPage },
              totalCount,
              pageCursors,
              edges,
            },
          },
        }) => {
          // Check expected page cursors exist in response.
          const { first, around, last } = pageCursors
          expect(first).toEqual(null)
          expect(last).toEqual(null)
          expect(around.length).toEqual(4)
          let index
          for (index = 0; index < 4; index++) {
            expect(around[index].page).toBe(index + 1)
          }
          // Check that allowlisted shows are not included
          expect(edges).toHaveLength(1)
          // Check show data included in edges.
          expect(edges[0].node.name).toEqual("Catty Art Show")
          // Check that there is a next page.
          expect(hasNextPage).toBe(true)
          expect(totalCount).toEqual(35)
        }
      )
    })
  })
})
