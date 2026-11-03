import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import config from "config"
import { annotateTrace } from "lib/apis/phoenix"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import { ResolverContext } from "types/graphql"

const MAX_COMMENT_LENGTH = 2000

export const FEEDBACK_ANNOTATION = "user_feedback"

type AIAgentFeedbackRating = "THUMBS_UP" | "THUMBS_DOWN"

const AIAgentFeedbackRatingType = new GraphQLEnumType({
  name: "AIAgentFeedbackRating",
  values: {
    THUMBS_UP: { value: "THUMBS_UP" },
    THUMBS_DOWN: { value: "THUMBS_DOWN" },
  },
})

interface CreateAIAgentFeedbackInput {
  feedbackID: string
  rating: AIAgentFeedbackRating
  comment?: string | null
}

export const createAIAgentFeedbackMutation = mutationWithClientMutationId<
  CreateAIAgentFeedbackInput,
  { success: boolean },
  ResolverContext
>({
  name: "CreateAIAgentFeedback",
  description:
    "Rates one answer from the AI agent. Voting again on the same answer " +
    "replaces the earlier vote.",
  inputFields: {
    feedbackID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The `feedbackID` of the AIAgentTurnComplete being rated.",
    },
    rating: { type: new GraphQLNonNull(AIAgentFeedbackRatingType) },
    comment: {
      type: GraphQLString,
      description: `Optional free text, up to ${MAX_COMMENT_LENGTH} characters.`,
    },
  },
  outputFields: {
    success: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description:
        "False when the feedback could not be recorded; safe to ignore.",
      resolve: ({ success }) => success,
    },
  },
  mutateAndGetPayload: async ({ feedbackID, rating, comment }, context) => {
    // Same gate as the agent turn itself (see ./index.ts).
    if (!context.userID || !context.accessToken) {
      throw new Error("You need to be signed in to perform this action")
    }

    if (
      config.NODE_ENV !== "development" &&
      !isFeatureFlagEnabled("onyx_ai_agent-turn", { userId: context.userID })
    ) {
      throw new Error("This feature is not currently enabled")
    }

    if (comment && comment.length > MAX_COMMENT_LENGTH) {
      throw new Error(
        `Comment is too long (max ${MAX_COMMENT_LENGTH} characters)`
      )
    }

    const thumbsUp = rating === "THUMBS_UP"

    // The feedbackID is the turn's Phoenix trace ID. Keyed by user, so voting
    // again replaces the earlier vote.
    const success = await annotateTrace({
      traceID: feedbackID,
      name: FEEDBACK_ANNOTATION,
      identifier: context.userID,
      label: thumbsUp ? "thumbs_up" : "thumbs_down",
      score: thumbsUp ? 1 : 0,
      explanation: comment?.trim(),
      metadata: { userID: context.userID },
    })

    return { success }
  },
})
