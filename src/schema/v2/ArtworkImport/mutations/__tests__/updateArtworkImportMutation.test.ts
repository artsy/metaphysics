import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkImportMutation", () => {
  it("updates an artwork import successfully", async () => {
    const artworkImportUpdateLoader = jest.fn().mockResolvedValue({
      id: "artwork-import-1",
      location_id: "partner-location-1",
    })

    const mutation = gql`
      mutation {
        updateArtworkImport(
          input: {
            artworkImportID: "artwork-import-1"
            locationID: "partner-location-1"
          }
        ) {
          updateArtworkImportOrError {
            ... on UpdateArtworkImportSuccess {
              artworkImport {
                internalID
                locationID
              }
            }
          }
        }
      }
    `

    const context = { artworkImportUpdateLoader }
    const result = await runAuthenticatedQuery(mutation, context)

    expect(artworkImportUpdateLoader).toHaveBeenCalledWith("artwork-import-1", {
      location_id: "partner-location-1",
    })

    expect(result).toEqual({
      updateArtworkImport: {
        updateArtworkImportOrError: {
          artworkImport: {
            internalID: "artwork-import-1",
            locationID: "partner-location-1",
          },
        },
      },
    })
  })
})
