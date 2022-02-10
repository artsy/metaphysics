import { GraphQLObjectType, GraphQLString, GraphQLBoolean } from "graphql"
import { ResolverContext } from "types/graphql"

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
      inProgress: {
        type: GraphQLBoolean,
        resolve: (consignmentSubmission) => {
          const inProgressSubmissionStates = [
            "submitted",
            "published",
            "approved",
            "hold",
            "open",
          ]

          return inProgressSubmissionStates.includes(
            consignmentSubmission.state
          )
        },
      },
    }
  },
})

export default ArtworkConsignmentSubmissionType
