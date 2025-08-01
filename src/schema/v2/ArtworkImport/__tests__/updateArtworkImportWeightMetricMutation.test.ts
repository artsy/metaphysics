import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkImportWeightMetricMutation", () => {
  const artworkImportID = "artwork-import-id"
  const fromWeightMetric = "lb"
  const toWeightMetric = "kg"

  const mutation = gql`
    mutation {
      updateArtworkImportWeightMetric(
        input: {
          artworkImportID: "artwork-import-id"
          fromWeightMetric: "lb"
          toWeightMetric: "kg"
        }
      ) {
        updateArtworkImportWeightMetricOrError {
          ... on UpdateArtworkImportWeightMetricSuccess {
            artworkImport {
              internalID
            }
          }
          ... on UpdateArtworkImportWeightMetricFailure {
            mutationError {
              type
              message
            }
          }
        }
      }
    }
  `

  it("updates artwork import weight metric", async () => {
    const mockArtworkImport = {
      id: artworkImportID,
    }

    const mockLoader = jest.fn().mockResolvedValue(mockArtworkImport)

    const context = {
      artworkImportUpdateWeightMetricLoader: mockLoader,
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockLoader).toHaveBeenCalledWith(artworkImportID, {
      from_weight_metric: fromWeightMetric,
      to_weight_metric: toWeightMetric,
    })

    expect(result).toEqual({
      updateArtworkImportWeightMetric: {
        updateArtworkImportWeightMetricOrError: {
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
      .mockRejectedValue(new Error("weight metric update failed"))

    const context = {
      artworkImportUpdateWeightMetricLoader: mockLoader,
    }

    await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
      "weight metric update failed"
    )
  })
})
