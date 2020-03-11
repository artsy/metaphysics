/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

// FIXME: We're now stitching. Remove these files once this work settles
xdescribe("addAssetToConsignmentSubmission", () => {
  it("creates a submission and returns its new data payload", async () => {
    const mutation = `
      mutation {
        requestCredentialsForAssetUpload(
          input: { name: "convection-staging", acl: "private", clientMutationId: "1231" }
        ) {
          asset {
            signature
            credentials
            policyEncoded
          }
        }
      }
    `

    const context = {
      createNewGeminiAssetLoader: () => () =>
        Promise.resolve({
          policy_encoded: "12345==",
          policy_document: {
            expiration: "2017-09-28T03:08:11.000Z",
            conditions: [
              {
                bucket: "artsy-data-uploads",
              },
              ["starts-with", "$key", "11RuACCaTK8ydW_DESA"],
              {
                acl: "private",
              },
              {
                success_action_status: "201",
              },
              ["content-length-range", 0, 104857600],
              ["starts-with", "$Content-Type", ""],
            ],
          },
          signature: "12345=",
          credentials: "AKIA123456789",
          clientMutationId: "1231",
        }),
    }

    await runAuthenticatedQuery(mutation, context).then(data => {
      expect(data).toMatchSnapshot()
    })
    expect.assertions(1)
  })
})
