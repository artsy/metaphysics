import gql from "lib/gql"
import { extractNodes } from "lib/helpers"

export const loadSubmissions = async (
  submissionIds: any[],
  convectionGraphQLLoader: any
) => {
  if (submissionIds.length) {
    const response = await convectionGraphQLLoader({
      query: gql`
        query ConversationEventConnection($ids: [ID!]) {
          submissions(ids: $ids) {
            edges {
              node {
                id
                state
                saleState
                rejectionReason
              }
            }
          }
        }
      `,
      variables: {
        ids: submissionIds,
      },
    })

    return extractNodes(response?.submissions)
  }
}
