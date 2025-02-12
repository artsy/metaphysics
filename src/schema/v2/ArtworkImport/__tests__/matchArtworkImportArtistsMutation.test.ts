import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("MatchArtworkImportArtistsMutation", () => {
  it("matches the artists", async () => {
    const artworkImportAssignArtistLoader = jest.fn().mockResolvedValue({
      updated_rows_count: 1,
    })

    const mutation = gql`
      mutation {
        assignArtworkImportArtist(
          input: {
            artworkImportID: "artwork-import-1"
            artistName: "artist-name"
            artistID: "artist-id"
          }
        ) {
          assignArtworkImportArtistOrError {
            ... on AssignArtworkImportArtistSuccess {
              updatedRowsCount
            }
          }
        }
      }
    `

    const context = {
      artworkImportAssignArtistLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportAssignArtistLoader).toHaveBeenCalledWith(
      "artwork-import-1",
      {
        artist_name: "artist-name",
        artist_id: "artist-id",
      }
    )

    expect(result).toEqual({
      assignArtworkImportArtist: {
        assignArtworkImportArtistOrError: {
          updatedRowsCount: 1,
        },
      },
    })
  })
})
