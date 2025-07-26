import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("ToggleArtworkImportRowExclusionMutation", () => {
  const artworkImportID = "artwork-import-id"
  const artworkImportRowID = "artwork-import-row-id"
  const excludedFromImport = true

  const mutation = gql`
    mutation {
      toggleArtworkImportRowExclusion(
        input: {
          artworkImportID: "artwork-import-id"
          artworkImportRowID: "artwork-import-row-id"
          excludedFromImport: true
        }
      ) {
        toggleArtworkImportRowExclusionOrError {
          ... on ToggleArtworkImportRowExclusionSuccess {
            artworkImport {
              internalID
            }
          }
          ... on ToggleArtworkImportRowExclusionFailure {
            mutationError {
              type
              message
            }
          }
        }
      }
    }
  `

  it("toggles artwork import row exclusion", async () => {
    const mockArtworkImport = {
      id: artworkImportID,
    }

    const mockLoader = jest.fn().mockResolvedValue(mockArtworkImport)

    const context = {
      artworkImportToggleRowExclusionLoader: mockLoader,
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockLoader).toHaveBeenCalledWith(artworkImportID, {
      row_id: artworkImportRowID,
      excluded_from_import: excludedFromImport,
    })

    expect(result).toEqual({
      toggleArtworkImportRowExclusion: {
        toggleArtworkImportRowExclusionOrError: {
          artworkImport: {
            internalID: artworkImportID,
          },
        },
      },
    })
  })

  it("returns an error when loader throws", async () => {
    const mockLoader = jest
      .fn()
      .mockRejectedValue(new Error("Toggle row exclusion failed"))

    const context = {
      artworkImportToggleRowExclusionLoader: mockLoader,
    }

    await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
      "Toggle row exclusion failed"
    )
  })
})
