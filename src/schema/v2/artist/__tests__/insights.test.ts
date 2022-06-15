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

  it("returns an empty list if field values are null", () => {
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

  it("does not build an insight if the field contains an empty string", () => {
    artist.solo_show_institutions = "  "

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

  it("returns artist insights if available", () => {
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

  it("splits Artist#collections by newline character", () => {
    artist.collections = "MoMA PS1\nMuseum of Modern Art (MoMA)"

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
          type: "COLLECTED",
          label: "Collected by a major institution",
          entities: ["MoMA PS1", "Museum of Modern Art (MoMA)"],
        },
      ])
    })
  })

  it("does not build an insight if active_secondary_market is false", () => {
    artist.active_secondary_market = false

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
})
