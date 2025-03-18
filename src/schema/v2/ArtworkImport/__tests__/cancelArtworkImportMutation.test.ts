import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkImportRowMutation", () => {
  it("updates a row", async () => {
    const cancelArtworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-id",
    })

    const artworkImportLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-id",
      state: "canceled",
    })

    const mutation = gql`
      mutation {
        cancelArtworkImport(input: { artworkImportID: "artwork-import-1" }) {
          cancelArtworkImportOrError {
            ... on CancelArtworkImportSuccess {
              artworkImport {
                state
              }
            }
          }
        }
      }
    `

    const context = {
      cancelArtworkImportLoader,
      artworkImportLoader,
    }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(cancelArtworkImportLoader).toHaveBeenCalledWith("artwork-import-1")

    expect(result).toEqual({
      cancelArtworkImport: {
        cancelArtworkImportOrError: {
          artworkImport: {
            state: "CANCELED",
          },
        },
      },
    })
  })
})
