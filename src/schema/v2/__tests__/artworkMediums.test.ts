/* eslint-disable promise/always-return */
import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("ArtworkMediums type", () => {
  it("fetches artworkMediums", () => {
    const query = gql`
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

  it("returns the associated filter gene", async () => {
    const context = {
      geneLoader: jest.fn(() =>
        Promise.resolve({
          id: "architecture-1",
          name: "Architecture",
        })
      ),
    }

    const query = gql`
      {
        artworkMediums {
          name
          longDescription
          filterGene {
            slug
            name
          }
        }
      }
    `

    const result = await runQuery(query, context)

    expect(context.geneLoader).toHaveBeenCalledTimes(19)

    expect(result.artworkMediums[0].filterGene).toEqual({
      slug: "architecture-1",
      name: "Architecture",
    })
  })
})
