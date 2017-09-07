import { runAuthenticatedQuery } from "test/utils"
const gql = args => args[0]

describe("UpdateSubmissionMutation", () => {
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
