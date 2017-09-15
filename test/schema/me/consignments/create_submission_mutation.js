import { runAuthenticatedQuery } from "test/utils"
import { config as createSubmissionMutation } from "schema/me/consignments/create_submission_mutation.js"

const gql = args => args[0]

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
          submission {
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
        }),
    }

    return runAuthenticatedQuery(mutation, rootValue).then(({ submissionCreateLoader }) => {
      expect(submissionCreateLoader).toMatchSnapshot()
    })
  })
})
