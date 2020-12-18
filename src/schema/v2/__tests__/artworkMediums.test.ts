/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("ArtworkMediums type", () => {
  it("fetches artworkMediums", () => {
    const query = `
      {
        artworkMediums {
          name
          longDescription
        }
      }
    `

    return runQuery(query).then((data) => {
      expect(data!.artworkMediums[0].name).toBe("Architecture")
      expect(data!.artworkMediums[0].longDescription).toBe(
        "Includes architectural models; buildings (e.g., house, temple)."
      )
    })
  })
})
