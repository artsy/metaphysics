import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateArtworkImportDimensionMetricMutation", () => {
  const artworkImportID = "artwork-import-id"
  const fromDimensionMetric = "in"
  const toDimensionMetric = "cm"

  const mutation = gql`
    mutation {
      updateArtworkImportDimensionMetric(
        input: {
          artworkImportID: "artwork-import-id"
          fromDimensionMetric: "in"
          toDimensionMetric: "cm"
        }
      ) {
        updateArtworkImportDimensionMetricOrError {
          ... on UpdateArtworkImportDimensionMetricSuccess {
            artworkImport {
              internalID
            }
          }
          ... on UpdateArtworkImportDimensionMetricFailure {
            mutationError {
              type
              message
            }
          }
        }
      }
    }
  `

  it("updates artwork import dimension metric", async () => {
    const mockArtworkImport = {
      id: artworkImportID,
    }

    const mockLoader = jest.fn().mockResolvedValue(mockArtworkImport)

    const context = {
      artworkImportUpdateDimensionMetricLoader: mockLoader,
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(mockLoader).toHaveBeenCalledWith(artworkImportID, {
      from_dimension_metric: fromDimensionMetric,
      to_dimension_metric: toDimensionMetric,
    })

    expect(result).toEqual({
      updateArtworkImportDimensionMetric: {
        updateArtworkImportDimensionMetricOrError: {
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
      .mockRejectedValue(new Error("Dimension metric update failed"))

    const context = {
      artworkImportUpdateDimensionMetricLoader: mockLoader,
    }

    await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
      "Dimension metric update failed"
    )
  })
})
