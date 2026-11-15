import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdatePartnerListPublicationCoverImageMutation", () => {
  const mutation = gql`
    mutation {
      updatePartnerListPublicationCoverImage(
        input: {
          partnerListID: "list-abc"
          remoteImageS3Key: "uploads/cover.jpg"
          remoteImageS3Bucket: "artsy-uploads"
        }
      ) {
        partnerListPublicationOrError {
          __typename
          ... on UpdatePartnerListPublicationCoverImageSuccess {
            partnerListPublication {
              internalID
              published
              coverImage {
                internalID
              }
            }
          }
          ... on UpdatePartnerListPublicationCoverImageFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("sends the uploaded file to Gravity and returns the publication", async () => {
    const context = {
      updatePartnerListPublicationCoverImageLoader: jest
        .fn()
        .mockResolvedValue({
          id: "pub-1",
          published: false,
          cover_image: {
            id: "img-1",
            gemini_token: "tok",
            image_urls: {},
            image_versions: [],
          },
        }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      context.updatePartnerListPublicationCoverImageLoader
    ).toHaveBeenCalledWith("list-abc", {
      remote_image_s3_key: "uploads/cover.jpg",
      remote_image_s3_bucket: "artsy-uploads",
    })
    expect(result).toEqual({
      updatePartnerListPublicationCoverImage: {
        partnerListPublicationOrError: {
          __typename: "UpdatePartnerListPublicationCoverImageSuccess",
          partnerListPublication: {
            internalID: "pub-1",
            published: false,
            coverImage: { internalID: "img-1" },
          },
        },
      },
    })
  })

  it("returns a mutation error when Gravity rejects it", async () => {
    const context = {
      updatePartnerListPublicationCoverImageLoader: jest
        .fn()
        .mockRejectedValue({ body: { error: "Not Found" } }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      updatePartnerListPublicationCoverImage: {
        partnerListPublicationOrError: {
          __typename: "UpdatePartnerListPublicationCoverImageFailure",
          mutationError: { message: "Not Found" },
        },
      },
    })
  })

  it("throws when not authenticated", async () => {
    await expect(
      runAuthenticatedQuery(mutation, {
        updatePartnerListPublicationCoverImageLoader: undefined,
      })
    ).rejects.toThrow("You need to be signed in to perform this action")
  })
})
