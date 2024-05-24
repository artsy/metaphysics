/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("Artist careerHighlights", () => {
  const artist = {
    _id: "123456",
  }

  const artistLoader = () => Promise.resolve(artist)

  const artistCareerHighlightsResponse = [
    {
      id: 1,
      venue: "Moma",
      solo: true,
      group: false,
      collected: false,
    },
    {
      id: 2,
      venue: "Guggenheim",
      solo: false,
      group: true,
      collected: false,
    },
  ]

  const artistCareerHighlightsLoader = jest
    .fn()
    .mockReturnValue(Promise.resolve(artistCareerHighlightsResponse))

  const artistCareerHighlightsWithoutResponse = jest
    .fn()
    .mockReturnValue(Promise.resolve([]))

  const context = {
    artistLoader,
    artistCareerHighlightsLoader,
  }

  const contextWithEmptyResponse = {
    artistLoader,
    artistCareerHighlightsLoader: artistCareerHighlightsWithoutResponse,
  }

  describe("with an artist_id", () => {
    it("returns artist career highlights for an artist", () => {
      const query = `
      {
        artist(id: "xyz") {
          careerHighlights {
            venue
            solo
            group
            collected
          }
        }
      }
    `

      return runQuery(query, context).then(({ artist: { ...response } }) => {
        const careerHighlights = response.careerHighlights
        expect(careerHighlights[0].venue).toBe("Moma")
        expect(careerHighlights[1].venue).toBe("Guggenheim")
      })
    })

    it("returns empty list when there are no highlights", () => {
      const query = `
      {
        artist(id: "xyz") {
          careerHighlights {
            venue
            solo
            group
            collected
          }
        }
      }
    `

      return runQuery(query, contextWithEmptyResponse).then((data) => {
        expect(data.artist.careerHighlights).toEqual([])
      })
    })
  })
})
