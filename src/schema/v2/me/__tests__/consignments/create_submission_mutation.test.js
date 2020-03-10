/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import { config as createSubmissionMutation } from "schema/v2/me/consignments/create_submission_mutation"

import gql from "lib/gql"

// FIXME: We're now stitching. Remove these files once this work settles
xdescribe("UpdateSubmissionMutation", () => {
  it("does not include the id param", () => {
    const mutation = createSubmissionMutation
    expect(Object.keys(mutation.inputFields)).not.toContain("id")
  })

  it("includes the state param", () => {
    const mutation = createSubmissionMutation
    expect(Object.keys(mutation.inputFields)).toContain("state")
  })

  it("updates a submission and returns its new data payload", async () => {
    const mutation = gql`
      mutation {
        createConsignmentSubmission(
          input: {
            artistID: "andy-warhol"
            clientMutationId: "2"
            authenticityCertificate: true
            dimensionsMetric: CM
          }
        ) {
          clientMutationId
          consignmentSubmission {
            artistID
            authenticityCertificate
            internalID
            dimensionsMetric
          }
        }
      }
    `
    const context = {
      submissionCreateLoader: () =>
        Promise.resolve({
          id: "106",
          artist_id: "andy-warhol",
          authenticity_certificate: true,
          dimensions_metric: "cm",
        }),
    }

    await runAuthenticatedQuery(mutation, context).then(data => {
      expect(data).toMatchSnapshot()
    })
    expect.assertions(1)
  })
})
