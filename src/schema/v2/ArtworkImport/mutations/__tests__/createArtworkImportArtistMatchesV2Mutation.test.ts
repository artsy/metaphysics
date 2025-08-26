import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreateArtworkImportArtistMatchesV2Mutation", () => {
  it("creates artist matches successfully", async () => {
    const artworkImportV2CreateArtistMatchesLoader = jest
      .fn()
      .mockResolvedValue({
        matched_artists_count: 8,
      })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportArtistMatchesV2(
          input: { artworkImportID: "artwork-import-1" }
        ) {
          createArtworkImportArtistMatchesV2OrError {
            ... on CreateArtworkImportArtistMatchesV2Success {
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
      artworkImportV2CreateArtistMatchesLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportV2CreateArtistMatchesLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {}
    )

    expect(result).toEqual({
      createArtworkImportArtistMatchesV2: {
        createArtworkImportArtistMatchesV2OrError: {
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
    const artworkImportV2CreateArtistMatchesLoader = jest
      .fn()
      .mockResolvedValue({
        matched_artists_count: 0,
      })
    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
    })

    const mutation = gql`
      mutation {
        createArtworkImportArtistMatchesV2(
          input: { artworkImportID: "artwork-import-1" }
        ) {
          createArtworkImportArtistMatchesV2OrError {
            ... on CreateArtworkImportArtistMatchesV2Success {
              matchedArtistsCount
            }
          }
        }
      }
    `

    const context = {
      artworkImportV2CreateArtistMatchesLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      createArtworkImportArtistMatchesV2: {
        createArtworkImportArtistMatchesV2OrError: {
          matchedArtistsCount: 0,
        },
      },
    })
  })
})
