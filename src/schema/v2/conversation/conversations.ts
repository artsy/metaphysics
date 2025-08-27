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
  toBeReplied?: boolean
  hasReply?: boolean
  partnerId?: string
  fromId?: string
  artistId?: string
  artworkId?: string
  type?: "Partner" | "User"
  conversationType?: "inquiry" | "order"
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

const ConversationTypeEnum = new GraphQLEnumType({
  name: "ConversationType",
  values: {
    INQUIRY: {
      value: "inquiry",
    },
    ORDER: {
      value: "order",
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
      totalCount: {
        type: GraphQLInt,
        resolve: ({ total_count }) => total_count,
      },
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
    fromId: {
      type: GraphQLString,
    },
    artistId: {
      type: GraphQLString,
    },
    artworkId: {
      type: GraphQLString,
    },
    type: {
      type: ConversationsInputModeEnum,
      defaultValue: ConversationsInputModeEnum.getValue("USER")?.value,
    },
    toBeReplied: {
      type: GraphQLBoolean,
    },
    conversationType: {
      type: ConversationTypeEnum,
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
        from_id: args.fromId ?? undefined,
        from_type: args.fromId ? "User" : undefined,
        to_type: "Partner",
        artist_id: args.artistId ?? undefined,
        artwork_id: args.artworkId ?? undefined,
        has_reply: args.hasReply ?? undefined,
        has_message: args.hasMessage ?? undefined,
        dismissed: !!args.dismissed,
        to_be_replied: args.toBeReplied ?? undefined,
        conversation_type: args.conversationType ?? undefined,
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
        { total_count },
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
