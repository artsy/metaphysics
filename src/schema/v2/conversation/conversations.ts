import { CursorPageable, pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import {
  GraphQLInt,
  GraphQLFieldConfig,
  GraphQLString,
  GraphQLBoolean,
} from "graphql"
import { connectionFromArraySlice, connectionDefinitions } from "graphql-relay"
import { assign } from "lodash"

import { ConversationType } from "schema/v2/conversation"
import { ResolverContext } from "types/graphql"
import { GraphQLEnumType } from "graphql"

interface ConversationsArguments extends CursorPageable {
  dismissed?: boolean
  hasMessage?: boolean
  hasReply?: boolean
  partnerId?: string
  type?: "Partner" | "User"
}

const ConversationsInputModeEnum = new GraphQLEnumType({
  name: "ConversationsInputMode",
  values: {
    PARTNER: {
      value: "Partner",
    },
    USER: {
      value: "User",
    },
  },
})

const Conversations: GraphQLFieldConfig<
  void,
  ResolverContext,
  ConversationsArguments
> = {
  type: connectionDefinitions({
    nodeType: ConversationType,
    connectionFields: {
      totalUnreadCount: {
        type: GraphQLInt,
        resolve: ({ total_unread_count }) => total_unread_count,
      },
    },
  }).connectionType,
  description: "Conversations, usually between a user and partner.",
  args: pageable({
    dismissed: {
      type: GraphQLBoolean,
    },
    hasMessage: {
      type: GraphQLBoolean,
    },
    hasReply: {
      type: GraphQLBoolean,
    },
    partnerId: {
      type: GraphQLString,
    },
    type: {
      type: ConversationsInputModeEnum,
      defaultValue: "USER",
    },
  }),
  resolve: (_root, args, { conversationsLoader, userID }) => {
    if (!conversationsLoader) {
      return null
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
    const expand = ["total_unread_count"]

    let params
    if (args.type === "Partner") {
      if (!args.partnerId) {
        throw new Error("Argument `partnerId` is required.")
      }

      params = {
        deleted: false,
        intercepted: false,
        to_id: args.partnerId,
        to_type: "Partner",

        // TODO
        dismissed: args.dismissed,
        has_message: args.hasMessage,
        has_reply: args.hasReply,
      }
      // User
    } else {
      params = {
        expand,
        from_id: userID,
        from_type: "User",
        has_message: true,
      }
    }
    return conversationsLoader({
      page,
      size,
      ...params,
    }).then(({ total_count, total_unread_count, conversations }) => {
      return assign(
        { total_unread_count },
        connectionFromArraySlice(conversations, args, {
          arrayLength: total_count,
          sliceStart: offset,
        })
      )
    })
  },
}

export default Conversations
