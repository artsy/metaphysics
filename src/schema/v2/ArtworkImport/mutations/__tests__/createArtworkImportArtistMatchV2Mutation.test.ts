import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkImportArtistMatchV2Mutation", () => {
  it("creates artist matches successfully", async () => {
    const artworkImportV2CreateArtistMatchLoader = jest.fn().mockResolvedValue({
      matched_artists_count: 8,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportArtistMatchV2(
          input: { artworkImportID: "artwork-import-1" }
        ) {
          createArtworkImportArtistMatchV2OrError {
            ... on CreateArtworkImportArtistMatchV2Success {
              artworkImportID
              matchedArtistsCount
              artworkImport {
                internalID
              }
            }
          }
        }
      }
    `

    const context = {
      artworkImportV2CreateArtistMatchLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportV2CreateArtistMatchLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {}
    )

    expect(result).toEqual({
      createArtworkImportArtistMatchV2: {
        createArtworkImportArtistMatchV2OrError: {
          artworkImportID: "artwork-import-1",
          matchedArtistsCount: 8,
          artworkImport: {
            internalID: "artwork-import-1",
          },
        },
      },
    })
  })

  it("handles zero matches", async () => {
    const artworkImportV2CreateArtistMatchLoader = jest.fn().mockResolvedValue({
      matched_artists_count: 0,
    })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportArtistMatchV2(
          input: { artworkImportID: "artwork-import-1" }
        ) {
          createArtworkImportArtistMatchV2OrError {
            ... on CreateArtworkImportArtistMatchV2Success {
              matchedArtistsCount
            }
          }
        }
      }
    `

    const context = {
      artworkImportV2CreateArtistMatchLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createArtworkImportArtistMatchV2: {
        createArtworkImportArtistMatchV2OrError: {
          matchedArtistsCount: 0,
        },
      },
    })
  })
})
