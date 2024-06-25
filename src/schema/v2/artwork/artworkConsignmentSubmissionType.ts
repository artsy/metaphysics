import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

// Based directly on Convection Submission#state: https://github.com/artsy/convection/blob/main/app/models/submission.rb
export const ArtworkConsignmentSubmissionStateType = new GraphQLEnumType({
  name: "ArtworkConsignmentSubmissionState",
  values: {
    DRAFT: { value: "draft" },
    SUBMITTED: { value: "submitted" },
    APPROVED: { value: "approved" },
    PUBLISHED: { value: "published" },
    REJECTED: { value: "rejected" },
    HOLD: { value: "hold" },
    CLOSED: { value: "closed" },
  },
})

const ArtworkConsignmentSubmissionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtworkConsignmentSubmission",
  fields: () => {
    return {
      internalID: {
        type: GraphQLString,
        resolver: ({ id }) => id,
      },
      displayText: {
        type: GraphQLString,
        deprecationReason: "Prefer `stateLabel` field.",
        resolve: (consignmentSubmission) => {
          const state =
            consignmentSubmission.saleState || consignmentSubmission.state
          const statusDisplayTexts = {
            submitted: "Submission in progress",
            approved: "Submission evaluated",
            published: "Submission evaluated",
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

          return statusDisplayTexts[state?.toLowerCase()] || "Unrecognized"
        },
      },
      isSold: {
        type: GraphQLBoolean,
        resolve: (consignmentSubmission) => {
          const state =
            consignmentSubmission.saleState || consignmentSubmission.state

          return "sold" === state?.toLowerCase()
        },
      },
      inProgress: {
        type: GraphQLBoolean,
        resolve: (consignmentSubmission) => {
          const state =
            consignmentSubmission.saleState || consignmentSubmission.state

          return ["submitted", "hold", "open"].includes(state?.toLowerCase())
        },
      },
      state: {
        type: new GraphQLNonNull(ArtworkConsignmentSubmissionStateType),
        description: "Submission state.",
        resolve: ({ state }) => {
          return state.toLowerCase()
        },
      },
      stateLabel: {
        type: GraphQLString,
        description: "Submission state label visible to the user.",
        resolve: ({ state }) => {
          switch (state.toLowerCase()) {
            case "approved":
            case "rejected":
            case "closed":
            case "published":
              return "Evaluation Complete"
            default:
              return "In Progress"
          }
        },
      },
      stateHelpMessage: {
        type: GraphQLString,
        description: "More information about the submission state.",
        resolve: ({ state }) => {
          switch (state.toLowerCase()) {
            case "approved":
            case "rejected":
            case "closed":
            case "published":
              return "Our specialists have reviewed this submission and determined that we do not currently have a market for it."
            default:
              return "The artwork is being reviewed or is in the sale process."
          }
        },
      },
    }
  },
})

export default ArtworkConsignmentSubmissionType
