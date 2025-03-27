import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("AddInstallShotToPartnerShowMutation", () => {
  const mutation = gql`
    mutation {
      addInstallShotToPartnerShow(
        input: {
          showId: "show123"
          s3Bucket: "partner-images"
          s3Key: "show/123/install-shots/image1.jpg"
          caption: "Opening night"
        }
      ) {
        showOrError {
          __typename
          ... on AddInstallShotToPartnerShowSuccess {
            show {
              internalID
              name
              status
            }
          }
          ... on AddInstallShotToPartnerShowFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("adds an installation shot to a partner show", async () => {
    const context = {
      addInstallShotToPartnerShowLoader: (identifiers, data) => {
        // Test that we're sending the right data
        expect(identifiers).toEqual({ showId: "show123" })
        expect(data).toEqual({
          remote_image_s3_bucket: "partner-images",
          remote_image_s3_key: "show/123/install-shots/image1.jpg",
          caption: "Opening night",
        })

        return Promise.resolve({
          showId: "show123",
          name: "Sample Show",
          status: "running",
        })
      },
      showLoader: () =>
        Promise.resolve({
          _id: "show123",
          name: "Sample Show",
          status: "running",
        }),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toEqual({
      addInstallShotToPartnerShow: {
        showOrError: {
          __typename: "AddInstallShotToPartnerShowSuccess",
          show: {
            internalID: "show123",
            name: "Sample Show",
            status: "running",
          },
        },
      },
    })
  })
})
