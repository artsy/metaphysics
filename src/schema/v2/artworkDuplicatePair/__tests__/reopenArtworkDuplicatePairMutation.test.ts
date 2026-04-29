import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mockPair = {
  id: "pair-1",
  artwork_1_id: "artwork-1",
  artwork_2_id: "artwork-2",
  status: "dismissed",
  similarity_score: 0.95,
  detection_version: "v1",
  match_metadata: null,
  mergeable: true,
  dismissed_at: "2024-01-02T00:00:00Z",
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

describe("reopenArtworkDuplicatePairMutation", () => {
  it("reopens a dismissed pair", async () => {
    const updateArtworkDuplicatePairLoader = jest.fn().mockResolvedValue({
      ...mockPair,
      status: "open",
      dismissed_at: null,
    })
    const artworkLoader = jest.fn().mockResolvedValue(mockArtwork)

    const mutation = gql`
      mutation {
        reopenArtworkDuplicatePair(input: { id: "pair-1" }) {
          artworkDuplicatePairOrError {
            ... on ReopenArtworkDuplicatePairSuccess {
              artworkDuplicatePair {
                internalID
                status
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
      status: "open",
    })

    expect(
      result.reopenArtworkDuplicatePair.artworkDuplicatePairOrError
        .artworkDuplicatePair
    ).toEqual({
      internalID: "pair-1",
      status: "OPEN",
    })
  })

  it("returns an error when gravity fails", async () => {
    const updateArtworkDuplicatePairLoader = jest
      .fn()
      .mockRejectedValue(
        new Error(
          `https://stagingapi.artsy.net/api/v1/artwork_duplicate_pair/pair-1 - {"type":"param_error","message":"Pair is already open"}`
        )
      )

    const mutation = gql`
      mutation {
        reopenArtworkDuplicatePair(input: { id: "pair-1" }) {
          artworkDuplicatePairOrError {
            __typename
            ... on ReopenArtworkDuplicatePairFailure {
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
      result.reopenArtworkDuplicatePair.artworkDuplicatePairOrError
    ).toEqual({
      __typename: "ReopenArtworkDuplicatePairFailure",
      mutationError: {
        message: "Pair is already open",
      },
    })
  })
})
