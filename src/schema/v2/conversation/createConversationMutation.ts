import {
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLEnumType,
  GraphQLList,
  GraphQLInputObjectType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import Conversation from "schema/v2/conversation"

type UserType = "Partner" | "User"

interface CreateConversationMutationInputProps {
  fromId: string
  fromType: UserType
  fromName: string
  fromEmail: string
  toId: string
  toType: UserType
  toName: string
  items: Array<{
    itemId: string
    itemType: string
  }>
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

const CreateConversationItemTypeEnum = new GraphQLEnumType({
  name: "CreateConversationItemTypeEnum",
  values: {
    ARTWORK: {
      value: "Artwork",
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
    toName: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The name of the user who received the message.",
    },
    exchangeOrderId: {
      type: GraphQLString,
      description: "The id of the exchange order.",
    },
    initialMessage: {
      type: GraphQLString,
      description: "The initial message in the conversation.",
    },
    items: {
      description: "The items in the conversation.",
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLInputObjectType({
            name: "CreateConversationItem",
            fields: {
              itemId: {
                type: new GraphQLNonNull(GraphQLString),
                description: "The id of the item.",
              },
              itemType: {
                type: new GraphQLNonNull(CreateConversationItemTypeEnum),
                description: "The type of the item.",
              },
            },
          })
        )
      ),
    },
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    args,
    { conversationCreateLoader, conversationCreateConversationOrderLoader }
  ) => {
    if (
      !conversationCreateLoader ||
      !conversationCreateConversationOrderLoader
    ) {
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
        to_name: args.toName,
        exchange_order_id: args.exchangeOrderId,
        initial_message: args.initialMessage,
        items: args.items.map((item) => {
          return {
            item_id: item.itemId,
            item_type: item.itemType,
          }
        }),
      })

      if (args.exchangeOrderId) {
        const conversationOrder = await conversationCreateConversationOrderLoader(
          {
            conversation_id: conversation.id,
            exchange_order_id: args.exchangeOrderId,
          }
        )

        return conversationOrder
      }

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
