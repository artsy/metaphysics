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

  it("returns a fallback shape when the value isn't a string or boolean", () => {
    const artist = { solo_show_institutions: 7 }
    const insights = getArtistInsights(artist)
    const insight = insights[0]
    expect(insight).toEqual({ artist, count: 0 })
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
    ]

    fields.forEach((field) => {
      it(`returns an array of ${field.key} entities split by pipe`, () => {
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

  describe("newline delimited insight fields", () => {
    const value =
      "Art Institute of Chicago \nBrooklyn Museum \n       Hamburger Bahnhof"

    const fields = [
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
      it(`returns an empty array of entities but a count of 1 when the ${field.key} value is true`, () => {
        field.value = true
        const artist = {
          [field.key]: field.value,
        }

        const insights = getArtistInsights(artist)
        const insight = insights.find((insight) => insight.kind === field.kind)!

        expect(insight.count).toEqual(1)
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
})
