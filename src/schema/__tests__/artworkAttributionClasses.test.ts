/* eslint-disable promise/always-return */
import { runQuery } from "test/utils"

describe("ArtworkAttributionClasses type", () => {
  it("fetches artworkAttributionClasses", () => {
    const query = `
      {
        artworkAttributionClasses {
          id
          name
          info
          short_description
          long_description
        }
      }
    `

    return runQuery(query).then(data => {
      expect(data.artworkAttributionClasses[0].id).toBe("unique")
      expect(data.artworkAttributionClasses[0].name).toBe("Unique")
      expect(data.artworkAttributionClasses[0].short_description).toBe(
        "This is a unique work"
      )
      expect(data.artworkAttributionClasses[0].long_description).toBe(
        "One of a kind piece, created by the artist."
      )
    })
  })
})
