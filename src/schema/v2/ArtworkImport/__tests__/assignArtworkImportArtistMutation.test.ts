import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("AssignArtworkImportArtistMutation", () => {
  it("assigns an artist", async () => {
    const artworkImportMatchArtistsLoader = jest.fn().mockResolvedValue({
      matched: 5,
      unmatched: 4,
    })

    const mutation = gql`
      mutation {
        matchArtworkImportArtists(
          input: { artworkImportID: "artwork-import-1" }
        ) {
          matchArtworkImportArtistsOrError {
            ... on MatchArtworkImportArtistsSuccess {
              matched
              unmatched
            }
          }
        }
      }
    `

    const context = {
      artworkImportMatchArtistsLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportMatchArtistsLoader).toHaveBeenCalledWith(
      "artwork-import-1"
    )

    expect(result).toEqual({
      matchArtworkImportArtists: {
        matchArtworkImportArtistsOrError: {
          matched: 5,
          unmatched: 4,
        },
      },
    })
  })
})
