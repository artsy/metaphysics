import { ARTIST_INSIGHT_MAPPING, getArtistInsights } from "../helpers"

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
        key: "solo_show_institutions",
        kind: "SOLO_SHOW",
        value,
      },
      {
        key: "group_show_institutions",
        kind: "GROUP_SHOW",
        value,
      },
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
      {
        key: "collections",
        kind: "COLLECTED",
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
        },
      }

      const insights = getArtistInsights(artist)
      const insight = insights.find(
        (insight) => insight.kind === "HIGH_AUCTION_RECORD"
      )!

      expect(insight.label).toEqual("High auction record (£18.6m)")
      expect(insight.count).toEqual(0)
      expect(insight.entities).toEqual([])
      expect(insight.description).toEqual("Sotheby's, 2021")
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

  describe("gaining followers insight", () => {
    const fields = [
      {
        kind: "GAINING_FOLLOWERS",
        artist: {
          follow_count: 200,
          last_year_follow_count: 40,
        },
        returnsInsight: true,
      },
      {
        kind: "GAINING_FOLLOWERS",
        artist: {
          follow_count: 200,
          last_year_follow_count: 10,
        },
        returnsInsight: false,
      },
      {
        kind: "GAINING_FOLLOWERS",
        artist: {
          follow_count: 200,
          last_year_follow_count: 200,
        },
        returnsInsight: false,
      },
      {
        kind: "GAINING_FOLLOWERS",
        artist: {
          follow_count: 0,
          last_year_follow_count: 0,
        },
        returnsInsight: false,
      },
    ]

    fields.forEach((field) => {
      it(`${
        field.returnsInsight ? "returns" : "does not return"
      } insight when the follow_count is ${
        field.artist.follow_count
      } and last_year_follow_count is ${
        field.artist.last_year_follow_count
      }`, () => {
        const artist = field.artist

        const insights = getArtistInsights(artist)
        const insight = insights.find((insight) => insight.kind === field.kind)!

        expect(!!insight).toEqual(field.returnsInsight)
      })
    })
  })
})
