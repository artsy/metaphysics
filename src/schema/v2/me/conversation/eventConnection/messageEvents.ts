import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { get } from "lodash"
import { PaginatedFetcher } from "./combinedPagination"

const lastMessageId = (conversation) => {
  return get(conversation, "_embedded.last_message.id")
}

// Prepare the incoming args by adding a `before: ${lastMessageId}` if it is missing.
export const prepareConversationArgs = (conversation, args) => {
  const conversationArgs = { ...args }
  const argKeys = Object.keys(args)

  if (argKeys.includes("last") && !argKeys.includes("before")) {
    conversationArgs.before = `${lastMessageId(conversation)}`
  }

  return conversationArgs
}

export const fetchMessagesForPagination = (
  conversationId: string,
  conversationMessagesLoader: any,
  parent: { initial_message: any; from_name: any; from_email: any }
): PaginatedFetcher => async (size, offset, sort) => {
  const { initial_message, from_name, from_email } = parent
  // adapted from convertConnectionArgsToGravityArgs
  const page = size ? Math.round((size + offset) / size) : 1

  const {
    total_count: totalMessageCount,
    message_details: messageDetails,
  } = await conversationMessagesLoader({
    page,
    size,
    // sort, // double check this is the right place for this arg
    conversation_id: conversationId,
    "expand[]": "deliveries",
  })
  // Inject the conversation initiator's email into each message payload
  // so we can tell if the user sent a particular message.
  // Also inject the conversation id, since we need it in some message
  // resolvers (invoices).
  const messages = messageDetails.map((message) => {
    return {
      ...message,
      createdAt: message.created_at,
      conversation_initial_message: initial_message,
      conversation_from_name: from_name,
      conversation_from_address: from_email,
      conversation_id: conversationId,
    }
  })
  return {
    totalCount: totalMessageCount,
    nodes: messages,
  }
}
