/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("ArtistInsights type", () => {
  let artist = null as any
  let context = null as any

  const artistCareerHighlightsLoader = jest.fn()

  beforeEach(() => {
    artist = {
      id: "foo-bar",
      name: "Foo Bar",
    }
    context = {
      artistLoader: () => Promise.resolve(artist),
      artistCareerHighlightsLoader,
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("returns an empty array when there are no insights", () => {
    const query = `
        {
          artist(id: "foo-bar") {
            id
            insights {
              type
              label
              entities
            }
          }
        }
      `

    return runQuery(query, context).then((data) => {
      expect(data!.artist.insights).toEqual([])
    })
  })

  it("returns all insights when they are present", () => {
    artistCareerHighlightsLoader
      .mockReturnValueOnce([
        { venue: "MoMA PS1" },
        { venue: "Museum of Modern Art (MoMA)" },
      ])
      .mockReturnValueOnce([{ venue: "Metropolitan Museum of Art" }])
      .mockReturnValueOnce([{ venue: "Museum of Modern Art (MoMA)" }])

    artist.review_sources = "Artforum International Magazine"
    artist.biennials = "frieze"
    artist.active_secondary_market = true

    const query = `
          {
            artist(id: "foo-bar") {
              id
              insights {
                type
                label
                entities
              }
            }
          }
        `

    return runQuery(query, context).then((data) => {
      expect(data!.artist.insights).toEqual([
        {
          type: "ACTIVE_SECONDARY_MARKET",
          label: "Active secondary market",
          entities: [],
        },
        {
          type: "SOLO_SHOW",
          label: "Solo show at 2 major institutions",
          entities: ["MoMA PS1", "Museum of Modern Art (MoMA)"],
        },
        {
          type: "GROUP_SHOW",
          label: "Group show at a major institution",
          entities: ["Metropolitan Museum of Art"],
        },
        {
          type: "BIENNIAL",
          label: "Included in a major biennial",
          entities: ["frieze"],
        },
        {
          type: "COLLECTED",
          label: "Collected by a major institution",
          entities: ["Museum of Modern Art (MoMA)"],
        },
        {
          type: "REVIEWED",
          label: "Reviewed by a major art publication",
          entities: ["Artforum International Magazine"],
        },
      ])
    })
  })

  it("returns only matching insights when a kind is specified", () => {
    artistCareerHighlightsLoader
      .mockResolvedValueOnce([
        { venue: "MoMA PS1" },
        { venue: "Museum of Modern Art (MoMA)" },
      ])
      .mockResolvedValueOnce([{ venue: "Metropolitan Museum of Art" }])
      .mockResolvedValue([{ venue: "Museum of Modern Art (MoMA)" }])

    artist.review_sources = "Artforum International Magazine"
    artist.biennials = "frieze"
    artist.active_secondary_market = true

    const query = `
          {
            artist(id: "foo-bar") {
              id
              insights(kind: [SOLO_SHOW]) {
                type
                label
                entities
              }
            }
          }
        `

    return runQuery(query, context).then((data) => {
      expect(data!.artist.insights).toEqual([
        {
          type: "SOLO_SHOW",
          label: "Solo show at 2 major institutions",
          entities: ["MoMA PS1", "Museum of Modern Art (MoMA)"],
        },
      ])
    })
  })

  it("returns only matching insights when a few kinds are specified", () => {
    artistCareerHighlightsLoader
      .mockReturnValue([{ venue: "Metropolitan Museum of Art" }])
      .mockReturnValueOnce([
        { venue: "MoMA PS1" },
        { venue: "Museum of Modern Art (MoMA)" },
      ])

    artist.review_sources = "Artforum International Magazine"
    artist.biennials = "frieze"
    artist.active_secondary_market = true

    const query = `
          {
            artist(id: "foo-bar") {
              id
              insights(kind: [GROUP_SHOW, REVIEWED, SOLO_SHOW]) {
                type
                label
                entities
              }
            }
          }
        `

    return runQuery(query, context).then((data) => {
      expect(data!.artist.insights).toEqual([
        {
          type: "SOLO_SHOW",
          label: "Solo show at 2 major institutions",
          entities: ["MoMA PS1", "Museum of Modern Art (MoMA)"],
        },
        {
          type: "GROUP_SHOW",
          label: "Group show at a major institution",
          entities: ["Metropolitan Museum of Art"],
        },
        {
          type: "REVIEWED",
          label: "Reviewed by a major art publication",
          entities: ["Artforum International Magazine"],
        },
      ])
    })
  })

  it("returns an empty array when there are no matching insights and a kind is specified", () => {
    artistCareerHighlightsLoader.mockReturnValueOnce(null)

    artist.review_sources = "Artforum International Magazine"
    artist.biennials = "frieze"
    artist.active_secondary_market = true

    const query = `
          {
            artist(id: "foo-bar") {
              id
              insights(kind: [SOLO_SHOW]) {
                type
                label
                entities
              }
            }
          }
        `

    return runQuery(query, context).then((data) => {
      expect(data!.artist.insights).toEqual([])
    })
  })

  it("returns formatted insights", () => {
    artist.active_secondary_market = true
    artist.curated_trending_weekly = true
    artist.curated_emerging = true
    artist.vanguard_year = 2019
    artist.highAuctionRecord = true

    const query = `
      {
        artist(id: "foo-bar") {
          id
          insights(kind: [ACTIVE_SECONDARY_MARKET, CURATORS_PICK_EMERGING, TRENDING_NOW, ARTSY_VANGUARD_YEAR]) {
            description(format: HTML)
          }
        }
      }
    `

    return runQuery(query, context).then((data) => {
      expect(data!.artist.insights).toEqual([
        {
          description:
            '<p>Recent auction results in the <a href="/artist/foo-bar/auction-results">Artsy Price Database</a></p>',
        },
        {
          description:
            '<p>Featured in Artsy’s <a href="/collection/artsy-vanguard-artists">annual list</a> of the most promising artists working today</p>',
        },
        {
          description:
            '<p>Works by this artist were handpicked for <a href="/collection/curators-picks-emerging">this collection</a> of rising talents to watch.</p>',
        },
        {
          description:
            '<p><a href="/collection/trending-now">Works by this artist</a> are among the most searched, viewed, and asked-about pieces on Artsy.</p>',
        },
      ])
    })
  })
})
