import {
  GraphQLNonNull,
  GraphQLString,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { InternalIDFields } from "./object_identification"

const FeedbackType = new GraphQLObjectType<any, ResolverContext>({
  name: "Feedback",
  fields: () => ({
    ...InternalIDFields,
    message: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Feedback message",
    },
  }),
})

const SendFeedbackMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "SendFeedbackMutationSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    feedback: {
      type: FeedbackType,
      resolve: (feedback) => feedback,
    },
  }),
})

const SendFeedbackMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "SendFeedbackMutationFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const SendFeedbackMutationType = new GraphQLUnionType({
  name: "SendFeedbackMutationType",
  types: [SendFeedbackMutationSuccessType, SendFeedbackMutationFailureType],
})

const SendFeedbackMutationInputType = new GraphQLInputObjectType({
  name: "SendFeedbackMutationInput",
  fields: {
    message: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Message to be sent.",
    },
    email: {
      type: GraphQLString,
      description: "Email to associate with message (only used if logged out).",
    },
    name: {
      type: GraphQLString,
      description: "Name to associate with message (only used if logged out).",
    },
    url: {
      type: GraphQLString,
      description: "URL of page where feedback originated.",
    },
  },
})

export const sendFeedbackMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "SendFeedbackMutation",
  description: "Send a feedback message",
  inputFields: SendFeedbackMutationInputType.getFields(),
  outputFields: {
    feedbackOrError: {
      type: SendFeedbackMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: (params, { sendFeedbackLoader }) => {
    return sendFeedbackLoader(params)
      .then((result) => result)
      .catch((error) => {
        const formattedErr = formatGravityError(error)
        if (formattedErr) {
          return { ...formattedErr, _type: "GravityMutationError" }
        } else {
          throw new Error(error)
        }
      })
  },
})
