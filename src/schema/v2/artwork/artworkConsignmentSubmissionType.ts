import { GraphQLBoolean, GraphQLObjectType, GraphQLString } from "graphql"
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
          const state =
            consignmentSubmission.saleState || consignmentSubmission.state
          const statusDisplayTexts = {
            submitted: "Submission in progress",
            approved: "Submission in progress",
            published: "Submission in progress",
            rejected: "Submission evaluated",
            hold: "Submission in progress",
            closed: "Submission evaluated",
            open: "Submission in progress",
            sold: "Sold",
            "bought in": "Submission evaluated",
            canceled: "Submission evaluated",
            "withdrawn - pre-launch": "Submission evaluated",
            "withdrawn - post-launch": "Submission evaluated",
          }

          return statusDisplayTexts[state?.toLowerCase()]
        },
      },
      isSold: {
        type: GraphQLBoolean,
        resolve: (consignmentSubmission) => {
          const state =
            consignmentSubmission.saleState || consignmentSubmission.state

          return ["sold"].includes(state?.toLowerCase())
        },
      },
      inProgress: {
        type: GraphQLBoolean,
        resolve: (consignmentSubmission) => {
          const state =
            consignmentSubmission.saleState || consignmentSubmission.state

          return [
            "submitted",
            "published",
            "approved",
            "hold",
            "open",
          ].includes(state?.toLowerCase())
        },
      },
    }
  },
})

export default ArtworkConsignmentSubmissionType
