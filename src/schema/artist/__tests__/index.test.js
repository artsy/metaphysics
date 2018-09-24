/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"

describe("Artist type", () => {
  let artist = null
  let rootValue

  beforeEach(() => {
    rootValue = {
      artistLoader: () => artist,
      articlesLoader: () => Promise.resolve({ count: 22 }),
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
    return runQuery(`{ artist(id: "") { id } }`, rootValue).then(data => {
      expect(data.artist).toBe(null)
    })
  })

  it("fetches an artist by ID", () => {
    return runQuery(`{ artist(id: "foo-bar") { id, name } }`, rootValue).then(
      data => {
        expect(data.artist.id).toBe("foo-bar")
        expect(data.artist.name).toBe("Foo Bar")
      }
    )
  })

  it("returns the total number of partner shows for an artist", () => {
    const query = `
      {
        artist(id: "foo-bar") {
          counts {
            partner_shows
          }
        }
      }
    `

    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        artist: {
          counts: {
            partner_shows: 42,
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
            related_artists
          }
        }
      }
    `

    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        artist: {
          counts: {
            related_artists: 42,
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

    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        artist: {
          counts: {
            articles: 22,
          },
        },
      })
    })
  })

  it("returns false if artist has no metadata", () => {
    const query = `
      {
        artist(id: "foo-bar") {
          has_metadata
        }
      }
    `

    return runQuery(query, rootValue).then(data => {
      expect(data).toEqual({
        artist: {
          has_metadata: false,
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

    return runQuery(query, rootValue).then(data => {
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
            formatted_nationality_and_birthday
          }
        }
      `

      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            formatted_nationality_and_birthday: "b. 2000",
          },
        })
      })
    })

    it("adds b. to birthday if only a date is provided", () => {
      artist.birthday = "2000"

      const query = `
        {
          artist(id: "foo-bar") {
            formatted_nationality_and_birthday
          }
        }
      `

      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            formatted_nationality_and_birthday: "b. 2000",
          },
        })
      })
    })

    it("does not change birthday if birthday contains Est.", () => {
      artist.birthday = "Est. 2000"

      const query = `
        {
          artist(id: "foo-bar") {
            formatted_nationality_and_birthday
          }
        }
      `

      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            formatted_nationality_and_birthday: "Est. 2000",
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
            formatted_nationality_and_birthday
          }
        }
      `

      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            formatted_nationality_and_birthday: "Martian, b. 2000",
          },
        })
      })
    })

    it("returns only nationality if no birthday is provided", () => {
      artist.nationality = "Martian"

      const query = `
        {
          artist(id: "foo-bar") {
            formatted_nationality_and_birthday
          }
        }
      `

      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            formatted_nationality_and_birthday: "Martian",
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
            formatted_nationality_and_birthday
          }
        }
      `

      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            formatted_nationality_and_birthday: "Martian, 2000–2012",
          },
        })
      })
    })
    it("returns null if neither birthday, deathday, nor nationality are provided", () => {
      const query = `
        {
          artist(id: "foo-bar") {
            formatted_nationality_and_birthday
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            formatted_nationality_and_birthday: null,
          },
        })
      })
    })
    it("returns null if neither birthday nor nationality are provided", () => {
      artist.deathday = "2016"
      const query = `
        {
          artist(id: "foo-bar") {
            formatted_nationality_and_birthday
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            formatted_nationality_and_birthday: null,
          },
        })
      })
    })
  })
  describe("artworks_connection", () => {
    beforeEach(() => {
      const count = 20
      artist.published_artworks_count = count
      artist.forsale_artworks_count = count
      const artworks = Promise.resolve(Array(count))
      rootValue.artistArtworksLoader = sinon
        .stub()
        .withArgs(artist.id)
        .returns(artworks)
    })
    it("does not have a next page when the requested amount exceeds the count", () => {
      const query = `
        {
          artist(id: "foo-bar") {
            artworks_connection(first: 40) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            artworks_connection: {
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
            artworks_connection(first: 20, filter: IS_FOR_SALE) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            artworks_connection: {
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
            artworks_connection(first: 10, filter: IS_FOR_SALE) {
              pageInfo {
                hasNextPage
              }
            }
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            artworks_connection: {
              pageInfo: {
                hasNextPage: true,
              },
            },
          },
        })
      })
    })
  })
  describe("biography_blurb", () => {
    it("returns the blurb if present", () => {
      artist.blurb = "catty blurb"
      const query = `
        {
          artist(id: "foo-bar") {
            blurb
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            blurb: "catty blurb",
          },
        })
      })
    })
  })
  describe("biography_blurb", () => {
    describe("with partner_bio set to true", () => {
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
          rootValue.partnerArtistsForArtistLoader = sinon
            .stub()
            .withArgs(artist.id)
            .returns(partnerArtists)
        })
        afterEach(() => {
          const query = `
            {
              artist(id: "foo-bar") {
                biography_blurb(partner_bio: true, format: HTML) {
                  text
                  credit
                  partner_id
                }
              }
            }
          `
          return runQuery(query, rootValue).then(data => {
            expect(data).toEqual({
              artist: {
                biography_blurb: {
                  text: "<p>new catty bio</p>\n",
                  credit: "Submitted by Catty Partner",
                  partner_id: "catty-partner",
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
          rootValue.partnerArtistsForArtistLoader = sinon
            .stub()
            .returns(Promise.resolve([]))
          artist.blurb = "artsy blurb"
          const query = `
            {
              artist(id: "foo-bar") {
                biography_blurb(partner_bio: true) {
                  text
                  credit
                  partner_id
                }
              }
            }
          `
          return runQuery(query, rootValue).then(data => {
            expect(data).toEqual({
              artist: {
                biography_blurb: {
                  text: "artsy blurb",
                  credit: null,
                  partner_id: null,
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
            biography_blurb {
              text
              credit
              partner_id
            }
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            biography_blurb: {
              text: "catty blurb",
              credit: null,
              partner_id: null,
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
      rootValue.partnerArtistsForArtistLoader = sinon
        .stub()
        .withArgs(artist.id)
        .returns(partnerArtists)
      const query = `
        {
          artist(id: "foo-bar") {
            biography_blurb {
              text
              credit
              partner_id
            }
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            biography_blurb: {
              text: "new catty bio",
              credit: "Submitted by Catty Partner",
              partner_id: "catty-partner",
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
      rootValue.relatedShowsLoader = sinon
        .stub()
        .withArgs(artist.id)
        .returns(
          Promise.resolve({
            body: [privateShow, publicShow, partnerlessShow, galaxyShow],
          })
        )
    })
    it("excludes shows from private partners for related shows", () => {
      const query = `
        {
          artist(id: "foo-bar") {
            shows {
              id
            }
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            shows: [
              {
                id: "ok",
              },
              {
                id: "galaxy-partner",
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
            exhibition_highlights {
              id
            }
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            exhibition_highlights: [
              {
                id: "ok",
              },
              {
                id: "galaxy-partner",
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
            formatted_artworks_count
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            formatted_artworks_count: "42 works, 21 for sale",
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
            formatted_artworks_count
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            formatted_artworks_count: "42 works",
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
            formatted_artworks_count
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            formatted_artworks_count: null,
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
            formatted_artworks_count
          }
        }
      `
      return runQuery(query, rootValue).then(data => {
        expect(data).toEqual({
          artist: {
            formatted_artworks_count: "1 work",
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
      return runQuery(query, rootValue).then(data => {
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
              id: "im-a-cat",
              title: "I'm a cat",
              artists: ["percy"],
            },
          ],
          aggregations: { total: { value: 75 } },
        })
      )
      rootValue.filterArtworksLoader = filterArtworksLoader

      const query = `
        {
          artist(id: "percy") {
            filtered_artworks(aggregations:[TOTAL], partner_id: null){
              artworks: artworks_connection(first: 10) {
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
              }
            }
          }
        }
      `

      return runQuery(query, rootValue).then(
        ({
          artist: {
            filtered_artworks: {
              artworks: { pageCursors },
            },
          },
        }) => {
          expect(filterArtworksLoader.mock.calls[0][0]).not.toHaveProperty(
            "partner_id"
          )
          // Check expected page cursors exist in response.
          const { first, around, last } = pageCursors
          expect(first).toEqual(null)
          expect(last.page).toEqual(8)
          let index
          for (index = 0; index < 4; index++) {
            expect(around[index].page).toBe(index + 1)
          }
        }
      )
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
      rootValue.articlesLoader = articlesLoader

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

      return runQuery(query, rootValue).then(
        ({
          artist: {
            articlesConnection: {
              pageInfo: { startCursor, hasNextPage, hasPreviousPage },
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
          // Check prev/next are true.
          expect(hasNextPage).toBe(true)
          expect(hasPreviousPage).toBe(true)
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
            },
          ],
          headers: { "x-total-count": 35 },
        })
      )
      rootValue.relatedShowsLoader = relatedShowsLoader

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
                hasPreviousPage
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

      return runQuery(query, rootValue).then(
        ({
          artist: {
            showsConnection: {
              pageInfo: { hasNextPage, hasPreviousPage },
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
          // Check show data included in edges.
          expect(edges[0].node.name).toEqual("Catty Art Show")
          // Check that there is a previous and next page.
          expect(hasNextPage).toBe(true)
          expect(hasPreviousPage).toBe(true)
          expect(totalCount).toEqual(35)
        }
      )
    })
  })
})
