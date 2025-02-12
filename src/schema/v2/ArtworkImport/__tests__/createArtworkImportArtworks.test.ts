import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkImportArtworksMutation", () => {
  it("creates artworks", async () => {
    const artworkImportCreateArtworksLoader = jest.fn().mockResolvedValue({
      created: 5,
      errors: 4,
    })

    const mutation = gql`
      mutation {
        createArtworkImportArtworks(
          input: { artworkImportID: "artwork-import-1" }
        ) {
          createArtworkImportArtworksOrError {
            ... on CreateArtworkImportArtworksSuccess {
              created
              errors
            }
          }
        }
      }
    `

    const context = {
      artworkImportCreateArtworksLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportCreateArtworksLoader).toHaveBeenCalledWith(
      "artwork-import-1"
    )

    expect(result).toEqual({
      createArtworkImportArtworks: {
        createArtworkImportArtworksOrError: {
          created: 5,
          errors: 4,
        },
      },
    })
  })
})
