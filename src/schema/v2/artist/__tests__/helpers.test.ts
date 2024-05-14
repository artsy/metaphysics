import {
  ARTIST_INSIGHT_MAPPING,
  getArtistInsights,
  getRecentShow,
} from "../helpers"

describe("getArtistInsights", () => {
  it("returns artist objects with no other information for each insight kind", () => {
    const artist = {}
    const insights = getArtistInsights(artist)
    const mappingLength = Object.entries(ARTIST_INSIGHT_MAPPING).length
    expect(insights.length).toEqual(mappingLength)
    insights.forEach((insight) => {
      expect(insight).toMatchObject({ artist })
    })
  })

  describe("pipe delimited insight fields", () => {
    const value =
      "Art Institute of Chicago |Brooklyn Museum |       Hamburger Bahnhof"

    const fields = [
      {
        key: "review_sources",
        kind: "REVIEWED",
        value,
      },
      {
        key: "biennials",
        kind: "BIENNIAL",
        value,
      },
    ]

    fields.forEach((field) => {
      it(`returns an array of ${field.key} entities split by newline`, () => {
        const artist = {
          [field.key]: field.value,
        }

        const insights = getArtistInsights(artist)
        const insight = insights.find((insight) => insight.kind === field.kind)!

        expect(insight.count).toEqual(3)
        expect(insight.entities).toEqual([
          "Art Institute of Chicago",
          "Brooklyn Museum",
          "Hamburger Bahnhof",
        ])
      })
    })
  })

  describe("boolean insight fields", () => {
    const fields = [
      {
        key: "active_secondary_market",
        kind: "ACTIVE_SECONDARY_MARKET",
        value: true,
      },
      {
        key: "curated_emerging",
        kind: "CURATORS_PICK_EMERGING",
        value: true,
      },
      {
        key: "curated_trending_weekly",
        kind: "TRENDING_NOW",
        value: true,
      },
    ]

    fields.forEach((field) => {
      it(`returns an empty array of entities when the ${field.key} value is true`, () => {
        field.value = true
        const artist = {
          [field.key]: field.value,
        }

        const insights = getArtistInsights(artist)
        const insight = insights.find((insight) => insight.kind === field.kind)!

        expect(insight.count).toEqual(0)
        expect(insight.entities).toEqual([])
      })

      it(`returns an empty artist object when the ${field.key} value is false`, () => {
        field.value = false
        const artist = {
          [field.key]: field.value,
        }

        const insights = getArtistInsights(artist)
        const insight = insights.find((insight) => insight.kind === field.kind)
        expect(insight).toBeUndefined()
      })
    })
  })

  describe("string insight fields", () => {
    it(`returns an empty array of entities when the HIGH_AUCTION_RECORD has a value and description`, () => {
      const artist = {
        highAuctionRecord: {
          price: "£18.6m",
          organization: "Sotheby's",
          year: "2021",
          url: "auction-result/123",
        },
      }

      const insights = getArtistInsights(artist)
      const insight = insights.find(
        (insight) => insight.kind === "HIGH_AUCTION_RECORD"
      )!

      expect(insight.label).toEqual("High auction record (£18.6m)")
      expect(insight.count).toEqual(0)
      expect(insight.entities).toEqual([])
      expect(insight.description).toEqual(
        "[Sotheby's, 2021](auction-result/123)"
      )
    })

    it(`returns an empty artist object when the HIGH_AUCTION_RECORD has no value`, () => {
      const artist = {}
      const insights = getArtistInsights(artist)
      const insight = insights.find(
        (insight) => insight.kind === "HIGH_AUCTION_RECORD"
      )

      expect(insight).toBeUndefined()
    })
  })

  describe("GAINING_FOLLOWERS insight", () => {
    const kind = "GAINING_FOLLOWERS"

    it("returns insight when the follower_growth is more than 20", () => {
      const artist = {
        follower_growth: 40,
      }

      const insights = getArtistInsights(artist)
      const insight = insights.find((insight) => insight.kind === kind)!

      expect(insight.description).toEqual(
        "40% increase in Artsy followers compared to same time last year."
      )
    })

    it("does not return insight when the follower_growth is less than 20", () => {
      const artist = {
        follower_growth: 10,
      }

      const insights = getArtistInsights(artist)
      const insight = insights.find((insight) => insight.kind === kind)

      expect(insight).toBeUndefined()
    })
  })

  describe("recent career event insight", () => {
    const field = {
      kind: "RECENT_CAREER_EVENT",
      artist: {
        recent_show: "2/2/2030|ai-weiwei|Solo|Gagosian Gallery",
      },
      value: "2030 Gagosian Gallery",
    }

    it("returns recent career event insights", () => {
      const artist = field.artist

      const insights = getArtistInsights(artist)
      const insight = insights.find((insight) => insight.kind === field.kind)!
      expect(insight.description).toEqual(field.value)
    })
  })

  describe("empty recent career event insight", () => {
    const field = {
      kind: "RECENT_CAREER_EVENT",
      artist: {
        recent_show: null,
      },
      value: null,
    }

    it("returns recent career event insights", () => {
      const artist = field.artist

      const insights = getArtistInsights(artist)
      const insight = insights.find((insight) => insight.kind === field.kind)!
      expect(insight).toBeUndefined()
    })
  })

  describe("getRecentShow", () => {
    it("returns the most recent show", () => {
      const artist1 = {
        recent_show: "2/2/2030|ai-weiwei|Solo|Gagosian Gallery",
      }

      const artist2 = {
        recent_show: "2/2/2010|ai-weiwei|Solo|Gagosian Gallery",
      }

      expect(getRecentShow(artist1)).toEqual("2030 Gagosian Gallery")
      expect(getRecentShow(artist2)).toEqual(null)
    })

    it("returns empty array if there empty recent show", () => {
      const artist = {
        recent_show: "",
      }

      const recentShow = getRecentShow(artist)
      expect(recentShow).toEqual(null)
    })

    it("returns empty array if there is no recent show", () => {
      const artist = {
        recent_show: null,
      }

      const recentShow = getRecentShow(artist)
      expect(recentShow).toEqual(null)
    })
  })
})
