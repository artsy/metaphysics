/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v1/test/utils"
import { config as updateSubmissionMutation } from "schema/v1/me/consignments/update_submission_mutation"
import gql from "lib/gql"

// FIXME: We're now stitching. Remove these files once this work settles
xdescribe("UpdateSubmissionMutation", () => {
  it("includes the id param", () => {
    const mutation = updateSubmissionMutation
    expect(Object.keys(mutation.inputFields)).toContain("id")
  })

  it("includes the state param", () => {
    const mutation = updateSubmissionMutation
    expect(Object.keys(mutation.inputFields)).toContain("state")
  })

  it("updates a submission and returns its new data payload", () => {
    const mutation = gql`
      mutation {
        updateConsignmentSubmission(
          input: {
            id: "108"
            artist_id: "andy-warhol"
            depth: "123"
            edition_size: "100"
            clientMutationId: "123123"
          }
        ) {
          clientMutationId
          consignment_submission {
            depth
          }
        }
      }
    `

    const context = {
      submissionUpdateLoader: () =>
        Promise.resolve({
          id: "106",
          artist_id: "andy-warhol",
          authenticity_certificate: true,
          depth: "1000",
        }),
    }

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, context).then(data => {
      expect(data).toMatchSnapshot()
    })
  })
})
