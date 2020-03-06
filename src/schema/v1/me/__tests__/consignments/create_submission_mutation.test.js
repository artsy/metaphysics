/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v1/test/utils"
import { config as createSubmissionMutation } from "schema/v1/me/consignments/create_submission_mutation"

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

  it("updates a submission and returns its new data payload", () => {
    const mutation = gql`
      mutation {
        createConsignmentSubmission(
          input: {
            artist_id: "andy-warhol"
            clientMutationId: "2"
            edition_size: "100"
            authenticity_certificate: true
            dimensions_metric: CM
          }
        ) {
          clientMutationId
          consignment_submission {
            artist_id
            authenticity_certificate
            id
            dimensions_metric
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

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, context).then(data => {
      expect(data).toMatchSnapshot()
    })
  })
})
