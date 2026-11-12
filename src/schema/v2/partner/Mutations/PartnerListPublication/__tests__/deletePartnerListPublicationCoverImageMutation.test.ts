import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DeletePartnerListPublicationCoverImageMutation", () => {
  const mutation = gql`
    mutation {
      deletePartnerListPublicationCoverImage(
        input: { partnerListID: "list-abc" }
      ) {
        partnerListPublicationOrError {
          __typename
          ... on DeletePartnerListPublicationCoverImageSuccess {
            partnerListPublication {
              internalID
              coverImage {
                internalID
              }
            }
          }
          ... on DeletePartnerListPublicationCoverImageFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("removes the cover image", async () => {
    const context = {
      deletePartnerListPublicationCoverImageLoader: jest
        .fn()
        .mockResolvedValue({ id: "pub-1", cover_image: null }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      context.deletePartnerListPublicationCoverImageLoader
    ).toHaveBeenCalledWith("list-abc")
    expect(result).toEqual({
      deletePartnerListPublicationCoverImage: {
        partnerListPublicationOrError: {
          __typename: "DeletePartnerListPublicationCoverImageSuccess",
          partnerListPublication: { internalID: "pub-1", coverImage: null },
        },
      },
    })
  })

  it("returns a mutation error when Gravity rejects it", async () => {
    const context = {
      deletePartnerListPublicationCoverImageLoader: jest
        .fn()
        .mockRejectedValue({ body: { error: "Publication Not Found" } }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      deletePartnerListPublicationCoverImage: {
        partnerListPublicationOrError: {
          __typename: "DeletePartnerListPublicationCoverImageFailure",
          mutationError: { message: "Publication Not Found" },
        },
      },
    })
  })
})
