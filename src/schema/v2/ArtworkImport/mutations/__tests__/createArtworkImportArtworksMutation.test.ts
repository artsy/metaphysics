import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkImportArtworksMutation", () => {
  it("creates artworks successfully", async () => {
    const artworkImportCreateArtworksLoader = jest.fn().mockResolvedValue({
      created: 5,
      errors: 0,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportArtworks(
          input: { artworkImportID: "artwork-import-1" }
        ) {
          createArtworkImportArtworksOrError {
            ... on CreateArtworkImportArtworksSuccess {
              artworkImportID
              createdArtworksCount
              artworkImport {
                internalID
              }
            }
          }
        }
      }
    `

    const context = {
      artworkImportCreateArtworksLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportCreateArtworksLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {}
    )

    expect(result).toEqual({
      createArtworkImportArtworks: {
        createArtworkImportArtworksOrError: {
          artworkImportID: "artwork-import-1",
          createdArtworksCount: 5,
          artworkImport: {
            internalID: "artwork-import-1",
          },
        },
      },
    })
  })

  it("handles zero artworks created", async () => {
    const artworkImportCreateArtworksLoader = jest.fn().mockResolvedValue({
      created: 0,
      errors: 0,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportArtworks(
          input: { artworkImportID: "artwork-import-1" }
        ) {
          createArtworkImportArtworksOrError {
            ... on CreateArtworkImportArtworksSuccess {
              createdArtworksCount
            }
          }
        }
      }
    `

    const context = {
      artworkImportCreateArtworksLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createArtworkImportArtworks: {
        createArtworkImportArtworksOrError: {
          createdArtworksCount: 0,
        },
      },
    })
  })
})
