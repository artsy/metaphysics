import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("CreatePartnerArtworkDuplicateMutation", () => {
  const basicMutation = gql`
    mutation {
      createPartnerArtworkDuplicate(
        input: {
          partnerId: "partner123"
          originalId: "original-artwork-123"
          title: "Duplicated Artwork Title"
          visibilityLevel: UNLISTED
        }
      ) {
        artworkImportOrError {
          __typename
          ... on CreatePartnerArtworkDuplicateSuccess {
            artwork {
              internalID
            }
          }
          ... on CreatePartnerArtworkDuplicateFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  const mutationWithoutVisibility = gql`
    mutation {
      createPartnerArtworkDuplicate(
        input: {
          partnerId: "partner123"
          originalId: "original-artwork-123"
          title: "Duplicated Artwork Title"
        }
      ) {
        artworkImportOrError {
          __typename
          ... on CreatePartnerArtworkDuplicateSuccess {
            artwork {
              internalID
            }
          }
          ... on CreatePartnerArtworkDuplicateFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("creates a duplicated artwork successfully", async () => {
    const mockDuplicatedArtwork = { _id: "duplicated-artwork-456" }

    const context = {
      partnerArtworksDuplicateLoader: jest.fn((partnerId, data) => {
        expect(partnerId).toEqual("partner123")
        expect(data).toEqual({
          original_id: "original-artwork-123",
          title: "Duplicated Artwork Title",
          visibility_level: "unlisted",
        })
        return Promise.resolve(mockDuplicatedArtwork)
      }),
    }

    const result = await runAuthenticatedQuery(basicMutation, context)

    expect(result).toEqual({
      createPartnerArtworkDuplicate: {
        artworkImportOrError: {
          __typename: "CreatePartnerArtworkDuplicateSuccess",
          artwork: {
            internalID: "duplicated-artwork-456",
          },
        },
      },
    })

    expect(context.partnerArtworksDuplicateLoader).toHaveBeenCalledTimes(1)
  })

  it("creates a duplicated artwork without visibility level", async () => {
    const mockDuplicatedArtwork = { _id: "duplicated-artwork-456" }

    const context = {
      partnerArtworksDuplicateLoader: jest.fn((partnerId, data) => {
        expect(partnerId).toEqual("partner123")
        expect(data).toEqual({
          original_id: "original-artwork-123",
          title: "Duplicated Artwork Title",
        })
        return Promise.resolve(mockDuplicatedArtwork)
      }),
    }

    const result = await runAuthenticatedQuery(
      mutationWithoutVisibility,
      context
    )

    expect(result).toEqual({
      createPartnerArtworkDuplicate: {
        artworkImportOrError: {
          __typename: "CreatePartnerArtworkDuplicateSuccess",
          artwork: {
            internalID: "duplicated-artwork-456",
          },
        },
      },
    })
  })

  it("handles errors correctly", async () => {
    const context = {
      partnerArtworksDuplicateLoader: jest
        .fn()
        .mockRejectedValue(new Error("Test error")),
    }

    await expect(runAuthenticatedQuery(basicMutation, context)).rejects.toThrow(
      "Test error"
    )
  })
})
