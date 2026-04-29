import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mockPair = {
  id: "pair-1",
  artwork_1_id: "artwork-1",
  artwork_2_id: "artwork-2",
  status: "open",
  similarity_score: 0.95,
  detection_version: "v1",
  match_metadata: null,
  mergeable: true,
  dismissed_at: null,
  merged_at: null,
  merged_into_artwork_id: null,
  merge_details: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
}

const mockArtwork = {
  id: "artwork-slug",
  _id: "artwork-1",
  title: "Test Artwork",
}

describe("mergeArtworkDuplicatePairMutation", () => {
  it("merges a pair", async () => {
    const updateArtworkDuplicatePairLoader = jest.fn().mockResolvedValue({
      ...mockPair,
      status: "merged",
      merged_at: "2024-01-02T00:00:00Z",
      merged_into_artwork_id: "artwork-1",
    })
    const artworkLoader = jest.fn().mockResolvedValue(mockArtwork)

    const mutation = gql`
      mutation {
        mergeArtworkDuplicatePair(
          input: { id: "pair-1", primaryArtworkId: "artwork-1" }
        ) {
          artworkDuplicatePairOrError {
            ... on MergeArtworkDuplicatePairSuccess {
              artworkDuplicatePair {
                internalID
                status
                mergedAt
                mergedIntoArtwork {
                  internalID
                  title
                }
              }
            }
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, {
      updateArtworkDuplicatePairLoader,
      artworkLoader,
    })

    expect(updateArtworkDuplicatePairLoader).toHaveBeenCalledWith("pair-1", {
      status: "merged",
      primary_artwork_id: "artwork-1",
    })

    expect(
      result.mergeArtworkDuplicatePair.artworkDuplicatePairOrError
        .artworkDuplicatePair
    ).toEqual({
      internalID: "pair-1",
      status: "MERGED",
      mergedAt: "2024-01-02T00:00:00Z",
      mergedIntoArtwork: {
        internalID: "artwork-1",
        title: "Test Artwork",
      },
    })
  })

  it("merges with field overrides", async () => {
    const updateArtworkDuplicatePairLoader = jest.fn().mockResolvedValue({
      ...mockPair,
      status: "merged",
    })
    const artworkLoader = jest.fn().mockResolvedValue(mockArtwork)

    const mutation = gql`
      mutation {
        mergeArtworkDuplicatePair(
          input: {
            id: "pair-1"
            primaryArtworkId: "artwork-1"
            fieldOverrides: { title: "Preferred Title", priceMinor: 10000 }
          }
        ) {
          artworkDuplicatePairOrError {
            ... on MergeArtworkDuplicatePairSuccess {
              artworkDuplicatePair {
                internalID
                status
              }
            }
          }
        }
      }
    `

    await runAuthenticatedQuery(mutation, {
      updateArtworkDuplicatePairLoader,
      artworkLoader,
    })

    expect(updateArtworkDuplicatePairLoader).toHaveBeenCalledWith("pair-1", {
      status: "merged",
      primary_artwork_id: "artwork-1",
      field_overrides: {
        title: "Preferred Title",
        price_minor: 10000,
      },
    })
  })

  it("returns an error when gravity fails", async () => {
    const updateArtworkDuplicatePairLoader = jest
      .fn()
      .mockRejectedValue(
        new Error(
          `https://stagingapi.artsy.net/api/v1/artwork_duplicate_pair/pair-1 - {"type":"param_error","message":"Pair is not mergeable"}`
        )
      )

    const mutation = gql`
      mutation {
        mergeArtworkDuplicatePair(
          input: { id: "pair-1", primaryArtworkId: "artwork-1" }
        ) {
          artworkDuplicatePairOrError {
            __typename
            ... on MergeArtworkDuplicatePairFailure {
              mutationError {
                message
              }
            }
          }
        }
      }
    `

    const result = await runAuthenticatedQuery(mutation, {
      updateArtworkDuplicatePairLoader,
    })

    expect(
      result.mergeArtworkDuplicatePair.artworkDuplicatePairOrError
    ).toEqual({
      __typename: "MergeArtworkDuplicatePairFailure",
      mutationError: {
        message: "Pair is not mergeable",
      },
    })
  })
})
