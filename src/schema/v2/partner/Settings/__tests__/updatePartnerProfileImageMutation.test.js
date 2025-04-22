import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdatePartnerProfileImageMutation", () => {
  const mutation = gql`
    mutation {
      updatePartnerProfileImage(
        input: {
          partnerId: "foo"
          type: "icon"
          remoteImageS3Key: "s3-key-here"
          remoteImageS3Bucket: "s3-bucket-here"
        }
      ) {
        partnerOrError {
          __typename
          ... on UpdatePartnerProfileImageSuccess {
            partner {
              internalID
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
          id: "profile-id",
          owner: {
            _id: "foo",
          },
        }),
    }

    const updatedProfile = await runAuthenticatedQuery(mutation, context)

    expect(updatedProfile).toEqual({
      updatePartnerProfileImage: {
        partnerOrError: {
          __typename: "UpdatePartnerProfileImageSuccess",
          partner: {
            internalID: "foo",
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
          partnerOrError: {
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
