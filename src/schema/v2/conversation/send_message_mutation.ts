import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLBoolean,
} from "graphql"
import {
  mutationWithClientMutationId,
  cursorForObjectInConnection,
} from "graphql-relay"
import { ConversationType, MessageEdge } from "./index"
import { ResolverContext } from "types/graphql"
import { GraphQLInputObjectType } from "graphql"

interface SendConversationMessageMutationProps {
  attachments?: {
    name: string
    type: string
    url: string
    id?: string
    size?: string
  }
  bodyHTML?: string
  bodyText: string
  from: string
  fromId?: string
  id: string
  replyAll?: boolean
  replyToMessageID: string
  to?: string[]
}

export default mutationWithClientMutationId<
  SendConversationMessageMutationProps,
  any,
  ResolverContext
>({
  name: "SendConversationMessageMutation",
  description: "Appending a message to a conversation thread",
  inputFields: {
    attachments: {
      description: "Attachments to the message",
      type: new GraphQLList(
        new GraphQLNonNull(
          new GraphQLInputObjectType({
            name: "ConversationMessageAttachmentInput",
            fields: {
              name: {
                type: new GraphQLNonNull(GraphQLString),
              },
              type: {
                type: new GraphQLNonNull(GraphQLString),
              },
              url: {
                type: new GraphQLNonNull(GraphQLString),
              },
              id: {
                type: GraphQLString,
              },
              size: {
                type: GraphQLString,
              },
            },
          })
        )
      ),
    },
    bodyHTML: {
      description: "Message body (html)",
      type: GraphQLString,
    },
    bodyText: {
      description: "Message body (text)",
      type: new GraphQLNonNull(GraphQLString),
    },
    from: {
      description:
        "Sender email, optionally including display string (like 'Jane Doe <jane@doe.com>').",
      type: new GraphQLNonNull(GraphQLString),
    },
    fromId: {
      description: "Sender user id",
      type: GraphQLString,
    },
    id: {
      description: "The id of the conversation to be updated",
      type: new GraphQLNonNull(GraphQLString),
    },
    replyAll: {
      description: "Reply to all",
      type: GraphQLBoolean,
      defaultValue: true,
    },
    replyToMessageID: {
      description: "The message being replied to",
      type: new GraphQLNonNull(GraphQLString),
    },
    to: {
      description: "Recepients emails.",
      type: new GraphQLList(GraphQLString),
    },
  },
  outputFields: {
    conversation: {
      type: ConversationType,
      resolve: ({ conversation }) => conversation,
    },
    messageEdge: {
      type: MessageEdge,
      resolve: ({ newMessagePayload }) => {
        return {
          cursor: cursorForObjectInConnection(
            [newMessagePayload],
            newMessagePayload
          ),
          node: newMessagePayload,
        }
      },
    },
  },
  mutateAndGetPayload: (
    args,
    { conversationLoader, conversationCreateMessageLoader, userID }
  ) => {
    if (!conversationCreateMessageLoader || !conversationLoader) {
      return null
    }

    // The params replyAll and to are mutually exclusive. If replyAll: false
    // and `to` is defined, set `replyAll: undefined` to avoid Impulse error.
    const replyAll =
      args.replyAll === false && args.to ? undefined : args.replyAll

    return conversationCreateMessageLoader(args.id, {
      attachments: args.attachments,
      body_html: args.bodyHTML,
      body_text: args.bodyText,
      from: args.from,
      from_id: args.fromId ?? userID,
      reply_all: replyAll,
      reply_to_message_id: args.replyToMessageID,
      to: args.to,
    })
      .then(({ id: newMessageID }) => {
        return conversationLoader(args.id).then((updatedConversation) => {
          return {
            conversation: updatedConversation,

            // Because Impulse does not have the full new message object available
            // immediately, we return an optimistic response so the mutation can
            // return it too.
            newMessagePayload: {
              attachments: args.attachments || [],
              body: args.bodyText,
              created_at: new Date().toISOString(),
              from_email_address: args.from,
              from_id: args.fromId ?? userID,
              id: newMessageID,
              raw_text: args.bodyText,
              // This addition is only for MP so it can determine if the message
              // was from the current user.
              conversation_from_address: updatedConversation.from_email,
            },
          }
        })
      })
      .catch((error) => {
        throw new Error(`Error: ${error.body?.error}`)
      })
  },
})
