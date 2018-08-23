/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"
import { config as createSubmissionMutation } from "schema/me/consignments/create_submission_mutation"

import gql from "lib/gql"

describe("UpdateSubmissionMutation", () => {
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
    const rootValue = {
      submissionCreateLoader: () =>
        Promise.resolve({
          id: "106",
          artist_id: "andy-warhol",
          authenticity_certificate: true,
          dimensions_metric: "cm",
        }),
    }

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, rootValue).then(data => {
      expect(data).toMatchSnapshot()
    })
  })
})
