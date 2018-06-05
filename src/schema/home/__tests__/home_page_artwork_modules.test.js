/* eslint-disable promise/always-return */
import { map, find } from "lodash"
import { runAuthenticatedQuery } from "test/utils"

describe("HomePageArtworkModules", () => {
  let rootValue = null

  let gravity
  let modules
  let relatedArtistsResponse

  beforeEach(() => {
    modules = {
      active_bids: false,
      followed_artists: false,
      followed_galleries: true,
      saved_works: true,
      recommended_works: true,
      live_auctions: false,
      current_fairs: true,
      related_artists: true,
      genes: false,
    }

    relatedArtistsResponse = {
      body: [
        {
          sim_artist: { id: "pablo-picasso", forsale_artworks_count: 1 },
          artist: { id: "charles-broskoski" },
        },
        {
          sim_artist: { id: "ann-craven", forsale_artworks_count: 1 },
          artist: { id: "margaret-lee" },
        },
      ],
    }

    gravity = sinon.stub()
    gravity.with = sinon.stub().returns(gravity)

    rootValue = {
      homepageModulesLoader: () => Promise.resolve(modules),
      suggestedSimilarArtistsLoader: () =>
        Promise.resolve(relatedArtistsResponse),
      followedGenesLoader: () => Promise.resolve({ body: [] }),
    }
  })

  it("shows all modules that should be returned", () => {
    const query = `
      {
        home_page {
          artwork_modules {
            key
            params {
              related_artist_id
              followed_artist_id
            }
          }
        }
      }
    `

    return runAuthenticatedQuery(query, rootValue).then(({ home_page }) => {
      const keys = map(home_page.artwork_modules, "key")

      // the default module response is 8 keys
      expect(keys).toEqual([
        "followed_galleries",
        "saved_works",
        "recommended_works",
        "current_fairs",
        "followed_artist",
        "related_artists",
        "generic_gene",
        "generic_gene",
        "generic_gene",
      ])

      const relatedArtistsModule = find(home_page.artwork_modules, {
        key: "related_artists",
      })

      const relatedArtistId = relatedArtistsModule.params.related_artist_id
      expect(["charles-broskoski", "margaret-lee"]).toContain(relatedArtistId)

      const followedArtistId = relatedArtistsModule.params.followed_artist_id
      expect(["pablo-picasso", "ann-craven"]).toContain(followedArtistId)
    })
  })

  it("shows skips the followed_artist module if no 2nd pair is returned", () => {
    relatedArtistsResponse = {
      body: [
        {
          sim_artist: { id: "pablo-picasso", forsale_artworks_count: 1 },
          artist: { id: "charles-broskoski" },
        },
      ],
    }
    rootValue.suggestedSimilarArtistsLoader = () =>
      Promise.resolve(relatedArtistsResponse)

    const query = `
      {
        home_page {
          artwork_modules {
            key
            params {
              related_artist_id
              followed_artist_id
            }
          }
        }
      }
    `

    return runAuthenticatedQuery(query, rootValue).then(({ home_page }) => {
      const keys = map(home_page.artwork_modules, "key")

      // the default module response is 8 keys
      expect(keys).toEqual([
        "followed_galleries",
        "saved_works",
        "recommended_works",
        "current_fairs",
        "related_artists",
        "generic_gene",
        "generic_gene",
        "generic_gene",
      ])

      const relatedArtistsModule = find(home_page.artwork_modules, {
        key: "related_artists",
      })
      expect(relatedArtistsModule.params).toEqual({
        related_artist_id: "charles-broskoski",
        followed_artist_id: "pablo-picasso",
      })
    })
  })

  it("skips the followed_artist module if the pairs are empty", () => {
    rootValue.suggestedSimilarArtistsLoader = () => Promise.resolve([])
    const query = `
      {
        home_page {
          artwork_modules {
            key
            params {
              related_artist_id
              followed_artist_id
            }
          }
        }
      }
    `

    return runAuthenticatedQuery(query, rootValue).then(({ home_page }) => {
      const keys = map(home_page.artwork_modules, "key")
      expect(keys).toEqual([
        "followed_galleries",
        "saved_works",
        "recommended_works",
        "current_fairs",
        "generic_gene",
        "generic_gene",
        "generic_gene",
      ])
    })
  })

  it("returns works similar to recently viewed", () => {
    const query = `
      {
        home_page {
          artwork_module(
            key: "similar_to_recently_viewed"
          ) {
            results { id }
          }
        }
      }
    `

    const expectedResults = {
      home_page: {
        artwork_module: {
          results: [{ id: "artwork-foo" }, { id: "artwork-bar" }],
        },
      },
    }

    rootValue.meLoader = () =>
      Promise.resolve({
        recently_viewed_artwork_ids: ["artwork-foo", "artwork-bar"],
      })
    rootValue.similarArtworksLoader = () =>
      Promise.resolve([
        { id: "artwork-foo", _id: "artwork-foo", name: "Foo" },
        { id: "artwork-bar", _id: "artwork-bar", name: "Bar" },
      ])

    return runAuthenticatedQuery(query, rootValue).then(results => {
      expect(results).toEqual(expectedResults)
    })
  })

  it("returns works similar to saved works", () => {
    const query = `
      {
        home_page {
          artwork_module(
            key: "similar_to_saved_works"
          ) {
            results { id }
          }
        }
      }
    `

    const expectedResults = {
      home_page: {
        artwork_module: {
          results: [{ id: "artwork-foo" }, { id: "artwork-bar" }],
        },
      },
    }

    rootValue.savedArtworksLoader = () =>
      Promise.resolve([
        { id: "artwork-foo", _id: "artwork-foo", name: "Foo" },
        { id: "artwork-bar", _id: "artwork-bar", name: "Bar" },
      ])
    rootValue.similarArtworksLoader = () =>
      Promise.resolve([
        { id: "artwork-foo", _id: "artwork-foo", name: "Foo" },
        { id: "artwork-bar", _id: "artwork-bar", name: "Bar" },
      ])

    return runAuthenticatedQuery(query, rootValue).then(results => {
      expect(results).toEqual(expectedResults)
    })
  })

  it("takes a preferred order of modules", () => {
    const query = `
    {
      home_page {
        artwork_modules(order: [RECOMMENDED_WORKS, FOLLOWED_ARTISTS, GENERIC_GENES]) {
          key
        }
      }
    }
    `

    return runAuthenticatedQuery(query, rootValue).then(
      ({ home_page: { artwork_modules } }) => {
        // The order of rails not included in the preferred order list is left as-is from Gravity’s
        // modules endpoint response. Rails in the preferred order list that aren’t even included in
        // Gravity’s response do not lead to an error (the FOLLOWED_ARTISTS rail).
        expect(map(artwork_modules, "key")).toEqual([
          "recommended_works",
          "generic_gene",
          "generic_gene",
          "generic_gene",
          "followed_galleries",
          "saved_works",
          "current_fairs",
          "followed_artist",
          "related_artists",
        ])
      }
    )
  })

  it("excludes modules upon request", () => {
    const query = `
    {
      home_page {
        artwork_modules(exclude: [RECOMMENDED_WORKS]) {
          key
        }
      }
    }
    `

    return runAuthenticatedQuery(query, rootValue).then(({ home_page }) => {
      const keys = map(home_page.artwork_modules, "key")
      expect(keys).not.toContain("recommended_works")
    })
  })
})
