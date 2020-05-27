/* eslint-disable promise/always-return */
import { runQuery } from "schema/v1/test/utils"

describe("ArtworkAttributionClasses type", () => {
  it("fetches artworkAttributionClasses", () => {
    const query = `
      {
        artworkAttributionClasses {
          id
          name
          info
          shortDescription
          longDescription
        }
      }
    `

    return runQuery(query).then((data) => {
      expect(data!.artworkAttributionClasses[0].id).toBe("unique")
      expect(data!.artworkAttributionClasses[0].name).toBe("Unique")
      expect(data!.artworkAttributionClasses[0].shortDescription).toBe(
        "This is a unique work"
      )
      expect(data!.artworkAttributionClasses[0].longDescription).toBe(
        "One of a kind piece, created by the artist."
      )
    })
  })
})
