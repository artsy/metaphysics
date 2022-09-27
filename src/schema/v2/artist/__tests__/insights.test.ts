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
          type: "SOLO_SHOW",
          label: "Solo show at a major institution",
          entities: ["MoMA PS1", "Museum of Modern Art (MoMA)"],
        },
        {
          type: "GROUP_SHOW",
          label: "Group show at a major institution",
          entities: ["Metropolitan Museum of Art"],
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
        {
          type: "BIENNIAL",
          label: "Included in a major biennial",
          entities: ["frieze"],
        },
        {
          type: "ACTIVE_SECONDARY_MARKET",
          label: "Active Secondary Market",
          entities: [],
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
          label: "Solo show at a major institution",
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
              insights(kind: [SOLO_SHOW, GROUP_SHOW, REVIEWED]) {
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
          label: "Solo show at a major institution",
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
})
