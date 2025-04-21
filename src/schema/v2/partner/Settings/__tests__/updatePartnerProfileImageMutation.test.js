import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdatePartnerProfileImageMutation", () => {
  const mutation = gql`
    mutation {
      updatePartnerProfileImage(
        input: {
          profileId: "foo"
          type: "icon"
          remoteImageS3Key: "s3-key-here"
          remoteImageS3Bucket: "s3-bucket-here"
        }
      ) {
        profileOrError {
          __typename
          ... on UpdatePartnerProfileImageSuccess {
            profile {
              internalID
              icon {
                url
              }
            }
          }
          ... on UpdatePartnerProfileImageFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("updates the partner's given profile image", async () => {
    const context = {
      updatePartnerProfileImageLoader: () =>
        Promise.resolve({
          _id: "foo",
          icon: { url: "https://image.url.com/" },
        }),
    }

    const updatedProfile = await runAuthenticatedQuery(mutation, context)

    expect(updatedProfile).toEqual({
      updatePartnerProfileImage: {
        profileOrError: {
          __typename: "UpdatePartnerProfileImageSuccess",
          profile: {
            internalID: "foo",
            icon: {
              url: "https://image.url.com/",
            },
          },
        },
      },
    })
  })

  describe("when profile is not found", () => {
    it("returns an error", async () => {
      const context = {
        updatePartnerProfileImageLoader: () =>
          Promise.reject(
            new Error(
              `https://stagingapi.artsy.net/api/v1/partners/foo/images/bar - {"type":"error","message":"Profile not found"}`
            )
          ),
      }

      const updatedPartner = await runAuthenticatedQuery(mutation, context)

      expect(updatedPartner).toEqual({
        updatePartnerProfileImage: {
          profileOrError: {
            __typename: "UpdatePartnerProfileImageFailure",
            mutationError: {
              message: "Profile not found",
            },
          },
        },
      })
    })
  })
})
