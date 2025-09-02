import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkImportArtistMatchMutation", () => {
  it("creates artist matches successfully", async () => {
    const artworkImportCreateArtistMatchLoader = jest.fn().mockResolvedValue({
      success: true,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportArtistMatch(
          input: { artworkImportID: "artwork-import-1" }
        ) {
          createArtworkImportArtistMatchOrError {
            ... on CreateArtworkImportArtistMatchSuccess {
              artworkImportID
              success
              artworkImport {
                internalID
              }
            }
          }
        }
      }
    `

    const context = {
      artworkImportCreateArtistMatchLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportCreateArtistMatchLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {}
    )

    expect(result).toEqual({
      createArtworkImportArtistMatch: {
        createArtworkImportArtistMatchOrError: {
          artworkImportID: "artwork-import-1",
          success: true,
          artworkImport: {
            internalID: "artwork-import-1",
          },
        },
      },
    })
  })

  it("handles successful matching", async () => {
    const artworkImportCreateArtistMatchLoader = jest.fn().mockResolvedValue({
      success: true,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportArtistMatch(
          input: { artworkImportID: "artwork-import-1" }
        ) {
          createArtworkImportArtistMatchOrError {
            ... on CreateArtworkImportArtistMatchSuccess {
              success
            }
          }
        }
      }
    `

    const context = {
      artworkImportCreateArtistMatchLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createArtworkImportArtistMatch: {
        createArtworkImportArtistMatchOrError: {
          success: true,
        },
      },
    })
  })
})
