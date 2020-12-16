/* eslint-disable promise/always-return */
import { runQuery } from "schema/v2/test/utils"

describe("ArtworkMediumTypes type", () => {
  it("fetches artworkMediumTypes", () => {
    const query = `
      {
        artworkMediumTypes {
          internalID
          name
          longDescription
        }
      }
    `

    return runQuery(query).then((data) => {
      expect(data!.artworkMediumTypes[0].internalID).toBe("Architecture")
      expect(data!.artworkMediumTypes[0].name).toBe("Architecture")
      expect(data!.artworkMediumTypes[0].longDescription).toBe(
        "Includes architectural models; buildings (e.g. house, temple)."
      )
    })
  })
})
