/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("ArtworkAttributionClasses type", () => {
  it("fetches artworkAttributionClasses", () => {
    const query = `
      {
        artworkAttributionClasses {
          internalID
          name
          shortDescription
          longDescription
        }
      }
    `

    return runQuery(query).then((data) => {
      expect(data!.artworkAttributionClasses[0].internalID).toBe("unique")
      expect(data!.artworkAttributionClasses[0].name).toBe("Unique")
      expect(data!.artworkAttributionClasses[0].shortDescription).toBe(
        "Unique work"
      )
      expect(data!.artworkAttributionClasses[0].longDescription).toBe(
        "One-of-a-kind piece."
      )
    })
  })
})
