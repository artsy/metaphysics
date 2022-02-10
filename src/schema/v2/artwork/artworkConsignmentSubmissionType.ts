import { ResolverContext } from "types/graphql"
import { GraphQLObjectType, GraphQLString } from "graphql"

const ArtworkConsignmentSubmissionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtworkConsignmentSubmission",
  fields: () => {
    return {
      displayText: {
        type: GraphQLString,
        resolve: (consignmentSubmission) => {
          const statusDisplayTexts = {
            draft: "Not displayed in My Collection",
            submitted: "Submission in progress",
            approved: "Submission in progress",
            published: "Submission in progress",
            rejected: "Submission in progress",
            hold: "Submission in progress",
            closed: "Submission evaluated",
          }

          return statusDisplayTexts[consignmentSubmission.state]
        },
      },
    }
  },
})

export default ArtworkConsignmentSubmissionType
