/* eslint-disable promise/always-return */
import { map, find } from "lodash"
import moment from "moment"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("HomePageArtworkModules", () => {
  let context = null

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

    context = {
      homepageModulesLoader: () => Promise.resolve(modules),
      suggestedSimilarArtistsLoader: () =>
        Promise.resolve(relatedArtistsResponse),
      followedGenesLoader: () => Promise.resolve({ body: [] }),
    }
  })

  it("shows all modules that should be returned", () => {
    const query = `
      {
        homePage {
          artworkModules {
            key
            params {
              relatedArtistID
              followedArtistID
            }
          }
        }
      }
    `

    return runAuthenticatedQuery(query, context).then(({ homePage }) => {
      const keys = map(homePage.artworkModules, "key")

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

      const relatedArtistsModule = find(homePage.artworkModules, {
        key: "related_artists",
      })

      const relatedArtistId = relatedArtistsModule.params.relatedArtistID
      expect(["charles-broskoski", "margaret-lee"]).toContain(relatedArtistId)

      const followedArtistId = relatedArtistsModule.params.followedArtistID
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
    context.suggestedSimilarArtistsLoader = () =>
      Promise.resolve(relatedArtistsResponse)

    const query = `
      {
        homePage {
          artworkModules {
            key
            params {
              relatedArtistID
              followedArtistID
            }
          }
        }
      }
    `

    return runAuthenticatedQuery(query, context).then(({ homePage }) => {
      const keys = map(homePage.artworkModules, "key")

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

      const relatedArtistsModule = find(homePage.artworkModules, {
        key: "related_artists",
      })
      expect(relatedArtistsModule.params).toEqual({
        relatedArtistID: "charles-broskoski",
        followedArtistID: "pablo-picasso",
      })
    })
  })

  it("skips the followed_artist module if the pairs are empty", () => {
    context.suggestedSimilarArtistsLoader = () => Promise.resolve([])
    const query = `
      {
        homePage {
          artworkModules {
            key
            params {
              relatedArtistID
              followedArtistID
            }
          }
        }
      }
    `

    return runAuthenticatedQuery(query, context).then(({ homePage }) => {
      const keys = map(homePage.artworkModules, "key")
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
        homePage {
          artworkModule(
            key: SIMILAR_TO_RECENTLY_VIEWED
          ) {
            results { slug }
          }
        }
      }
    `

    const expectedResults = {
      homePage: {
        artworkModule: {
          results: [{ slug: "artwork-foo" }, { slug: "artwork-bar" }],
        },
      },
    }

    context.meLoader = () =>
      Promise.resolve({
        recently_viewed_artwork_ids: ["artwork-foo", "artwork-bar"],
      })
    context.similarArtworksLoader = () =>
      Promise.resolve([
        { id: "artwork-foo", _id: "artwork-foo", name: "Foo" },
        { id: "artwork-bar", _id: "artwork-bar", name: "Bar" },
      ])

    return runAuthenticatedQuery(query, context).then((results) => {
      expect(results).toEqual(expectedResults)
    })
  })

  it("returns works similar to saved works", () => {
    const query = `
      {
        homePage {
          artworkModule(
            key: SIMILAR_TO_SAVED_WORKS
          ) {
            results { slug }
          }
        }
      }
    `

    const expectedResults = {
      homePage: {
        artworkModule: {
          results: [{ slug: "artwork-foo" }, { slug: "artwork-bar" }],
        },
      },
    }

    context.savedArtworksLoader = () =>
      Promise.resolve({
        body: [
          { id: "artwork-foo", _id: "artwork-foo", name: "Foo" },
          { id: "artwork-bar", _id: "artwork-bar", name: "Bar" },
        ],
      })
    context.similarArtworksLoader = () =>
      Promise.resolve([
        { id: "artwork-foo", _id: "artwork-foo", name: "Foo" },
        { id: "artwork-bar", _id: "artwork-bar", name: "Bar" },
      ])

    return runAuthenticatedQuery(query, context).then((results) => {
      expect(results).toEqual(expectedResults)
    })
  })

  it("takes a preferred order of modules", () => {
    const query = `
    {
      homePage {
        artworkModules(order: [RECOMMENDED_WORKS, FOLLOWED_ARTISTS, GENERIC_GENES]) {
          key
        }
      }
    }
    `

    return runAuthenticatedQuery(query, context).then(
      ({ homePage: { artworkModules } }) => {
        // The order of rails not included in the preferred order list is left as-is from Gravity’s
        // modules endpoint response. Rails in the preferred order list that aren’t even included in
        // Gravity’s response do not lead to an error (the FOLLOWED_ARTISTS rail).
        expect(map(artworkModules, "key")).toEqual([
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
      homePage {
        artworkModules(exclude: [RECOMMENDED_WORKS, GENERIC_GENES]) {
          key
        }
      }
    }
    `

    return runAuthenticatedQuery(query, context).then(({ homePage }) => {
      const keys = map(homePage.artworkModules, "key")
      expect(keys).not.toContain("recommended_works")
      expect(keys).not.toContain("generic_gene")
    })
  })

  it("includes modules upon request", () => {
    const query = `
    {
      homePage {
        artworkModules(
          maxFollowedGeneRails: -1
          include: [FOLLOWED_GALLERIES SAVED_WORKS]
        ) {
          key
        }
      }
    }
    `

    return runAuthenticatedQuery(query, context).then(({ homePage }) => {
      const keys = map(homePage.artworkModules, "key")

      expect(keys).toEqual(["followed_galleries", "saved_works"])
    })
  })

  it("includes modules upon request with empty includes", () => {
    const query = `
    {
      homePage {
        artworkModules(
          maxFollowedGeneRails: -1
          include: []
        ) {
          key
        }
      }
    }
    `

    return runAuthenticatedQuery(query, context).then(({ homePage }) => {
      const keys = map(homePage.artworkModules, "key")

      expect(keys).toEqual([])
    })
  })

  it("includes and excludes modules upon request", () => {
    const query = `
    {
      homePage {
        artworkModules(
          maxFollowedGeneRails: -1
          include: [FOLLOWED_GALLERIES SAVED_WORKS]
          exclude: [SAVED_WORKS RECOMMENDED_WORKS]
        ) {
          key
        }
      }
    }
    `

    return runAuthenticatedQuery(query, context).then(({ homePage }) => {
      const keys = map(homePage.artworkModules, "key")

      expect(keys).toEqual(["followed_galleries"])
    })
  })

  it("returns first running fair", async () => {
    const query = `
    {
      homePage {
        artworkModules(
          maxFollowedGeneRails: -1
          include: [CURRENT_FAIRS]
        ) {
          key
          title
        }
      }
    }`

    context.fairsLoader = () =>
      Promise.resolve({
        body: [
          {
            start_at: moment().add(1, "day"),
            end_at: moment().add(10, "day"),
            has_homepage_section: true,
            name: "fair-1",
          },
          {
            start_at: moment().subtract(2, "day"),
            end_at: moment().add(2, "day"),
            has_homepage_section: true,
            name: "fair-2",
          },
        ],
      })

    const { homePage } = await runAuthenticatedQuery(query, context)

    expect(homePage.artworkModules[0].title).toBe("fair-1")
  })
})
