/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("ArtistInsights type", () => {
  let artist = null as any
  let context = null as any

  beforeEach(() => {
    artist = {
      id: "foo-bar",
      name: "Foo Bar",
    }
    context = {
      artistLoader: () => Promise.resolve(artist),
    }
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
    artist.solo_show_institutions = "MoMA PS1|Museum of Modern Art (MoMA)"
    artist.group_show_institutions = "Metropolitan Museum of Art"
    artist.collections = "Museum of Modern Art (MoMA)"
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
    artist.solo_show_institutions = "MoMA PS1|Museum of Modern Art (MoMA)"
    artist.group_show_institutions = "Metropolitan Museum of Art"
    artist.collections = "Museum of Modern Art (MoMA)"
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
    artist.solo_show_institutions = "MoMA PS1|Museum of Modern Art (MoMA)"
    artist.group_show_institutions = "Metropolitan Museum of Art"
    artist.collections = "Museum of Modern Art (MoMA)"
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
    artist.solo_show_institutions = undefined
    artist.group_show_institutions = "Metropolitan Museum of Art"
    artist.collections = "Museum of Modern Art (MoMA)"
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
            '<p>Recent <a href="/artist/foo-bar/auction-results">auction results</a> in the Artsy Price Database</p>',
        },
        {
          description:
            '<p>Featured in Artsy’s <a href="/collection/the-artsy-vanguard">annual list</a> of the most promising artists working today</p>',
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
