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
    RESUBMITTED: { value: "resubmitted" },
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
        resolve: ({ id }) => id,
      },
      externalID: {
        type: GraphQLString,
        resolve: ({ externalId }) => externalId,
      },
      isEditable: {
        type: GraphQLBoolean,
        resolve: ({ state }) => {
          return ["REJECTED", "CLOSED", "PUBLISHED"].includes(state)
        },
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
            case "draft":
              return null
            case "approved":
              return "Approved"
            case "rejected":
              return "Submission Unsuccessful"
            default:
              return "In Progress"
          }
        },
      },
      stateLabelColor: {
        type: GraphQLString,
        resolve: ({ state }) => {
          switch (state.toLowerCase()) {
            case "rejected":
              return "black60"
            default:
              return "black100"
          }
        },
      },
      actionLabel: {
        type: GraphQLString,
        description:
          "Action label asks the user to poseed with the submission.",
        resolve: ({ state }) => {
          switch (state.toLowerCase()) {
            case "draft":
              return "Complete Submission"
            case "approved":
              return "Complete your Listing"
            default:
              return null
          }
        },
      },
      buttonLabel: {
        type: GraphQLString,
        description: "Button label visible to the user.",
        resolve: ({ state }) => {
          switch (state.toLowerCase()) {
            case "draft":
              return "Complete Submission"
            case "approved":
              return "Complete your Listing"
            case "submitted":
            case "published":
            case "resubmitted":
              return "Edit Submission"
            default:
              return null
          }
        },
      },
      stateHelpMessage: {
        type: GraphQLString,
        description: "More information about the submission state.",
        resolve: ({ state }) => {
          switch (state.toLowerCase()) {
            case "draft":
              return "You’ve started a submission to sell with Artsy but have not yet completed it."
            case "submitted":
              return "Your submission is currently being reviewed by our team. You will receive a response within 3 to 5 days."
            case "approved":
              return "Congratulations, your submission has been approved. Please provide additional information so we can list your work and match it with the best selling opportunity."
            case "published":
            case "resubmitted":
              return "Thank you for the information. Your submission is being assessed for sales opportunities. Our specialists will contact you via email or phone to coordinate the next steps."
            case "rejected":
              return "Our specialists have reviewed this submission and determined that we do not currently have a market for it."
            default:
              return "The artwork is currently being reviewed by our team."
          }
        },
      },
    }
  },
})

export default ArtworkConsignmentSubmissionType
