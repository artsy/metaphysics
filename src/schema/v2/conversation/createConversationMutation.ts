import {
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLEnumType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import Conversation from "schema/v2/conversation"

interface CreateConversationMutationInputProps {
  fromId: string
  fromType: string
  fromName: string
  fromEmail: string
  toId: string
  toType: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateConversationSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    conversation: {
      type: Conversation.type,
      resolve: (conversation) => conversation,
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreateConversationFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreateConversationResponseOrError",
  types: [SuccessType, ErrorType],
})

const CreateConversationTypeEnum = new GraphQLEnumType({
  name: "CreateConversationTypeEnum",
  values: {
    PARTNER: {
      value: "Partner",
    },
    USER: {
      value: "User",
    },
  },
})

export const createConversationMutation = mutationWithClientMutationId<
  CreateConversationMutationInputProps,
  any,
  ResolverContext
>({
  name: "CreateConversationMutation",
  description: "Create a conversation.",
  inputFields: {
    fromId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the user who sent the message.",
    },
    fromType: {
      type: new GraphQLNonNull(CreateConversationTypeEnum),
      description: "The type of the user who sent the message.",
    },
    fromName: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The name of the user who sent the message.",
    },
    fromEmail: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The email of the user who sent the message.",
    },
    toId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the user who received the message.",
    },
    toType: {
      type: new GraphQLNonNull(CreateConversationTypeEnum),
      description: "The type of the user who received the message.",
    },
    exchangeOrderId: {
      type: GraphQLString,
      description: "The id of the exchange order.",
    },
    initialMessage: {
      type: GraphQLString,
      description: "The initial message in the conversation.",
    },
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { conversationCreateLoader }) => {
    if (!conversationCreateLoader) {
      throw new Error("You need to be signed in to perform this action.")
    }

    try {
      const conversation = await conversationCreateLoader({
        from_id: args.fromId,
        from_type: args.fromType,
        from_name: args.fromName,
        from_email: args.fromEmail,
        intercepted: false,
        to_id: args.toId,
        to_type: args.toType,
        exchange_order_id: args.exchangeOrderId,
        initial_message: args.initialMessage,
      })

      return conversation
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
