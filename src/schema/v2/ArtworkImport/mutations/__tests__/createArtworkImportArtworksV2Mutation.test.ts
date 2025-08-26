import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkImportArtworksV2Mutation", () => {
  it("creates artworks successfully", async () => {
    const artworkImportV2CreateArtworksLoader = jest.fn().mockResolvedValue({
      created_artworks_count: 5,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportArtworksV2(
          input: { artworkImportID: "artwork-import-1" }
        ) {
          createArtworkImportArtworksV2OrError {
            ... on CreateArtworkImportArtworksV2Success {
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
      artworkImportV2CreateArtworksLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportV2CreateArtworksLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {}
    )

    expect(result).toEqual({
      createArtworkImportArtworksV2: {
        createArtworkImportArtworksV2OrError: {
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
    const artworkImportV2CreateArtworksLoader = jest.fn().mockResolvedValue({
      created_artworks_count: 0,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportArtworksV2(
          input: { artworkImportID: "artwork-import-1" }
        ) {
          createArtworkImportArtworksV2OrError {
            ... on CreateArtworkImportArtworksV2Success {
              createdArtworksCount
            }
          }
        }
      }
    `

    const context = {
      artworkImportV2CreateArtworksLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createArtworkImportArtworksV2: {
        createArtworkImportArtworksV2OrError: {
          createdArtworksCount: 0,
        },
      },
    })
  })
})
