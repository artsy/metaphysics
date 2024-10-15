import { date } from "schema/v2/fields/date"
import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from "graphql"
import {
  NodeInterface,
  InternalIDFields,
} from "schema/v2/object_identification"
import { AttachmentType } from "./attachment"
import { DeliveryType } from "./delivery"
import { isExisty } from "lib/helpers"
import { ResolverContext } from "types/graphql"

const MessageInitiatorType = new GraphQLObjectType<any, ResolverContext>({
  name: "MessageInitiator",
  description: "The participant who sent the message.",
  fields: {
    name: {
      type: GraphQLString,
    },
    email: {
      type: GraphQLString,
    },
  },
})

export const MessageType = new GraphQLObjectType<any, ResolverContext>({
  name: "Message",
  description: "A message in a conversation.",
  interfaces: [NodeInterface],
  fields: {
    ...InternalIDFields,
    impulseID: {
      description: "Impulse message id.",
      deprecationReason: "Prefer internalID",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ id }) => id,
    },
    isFirstMessage: {
      description: "True if message is the first in the conversation.",
      type: GraphQLBoolean,
      resolve: ({ is_first_message }) => is_first_message,
    },
    isFromUser: {
      description: "True if message is from the user to the partner.",
      type: GraphQLBoolean,
      resolve: (
        {
          from_id,
          from_email_address,
          conversation_from_address,
          from_principal,
        },
        _options,
        { userID }
      ) =>
        from_principal ||
        (userID && from_id === userID) ||
        from_email_address === conversation_from_address,
    },
    from: {
      type: MessageInitiatorType,
      resolve: ({ from, from_email_address }) => {
        const namePartRegex = /"([^"]*)"/
        const namePart = namePartRegex.exec(from)
        let name
        // FIXME: Object is possibly 'null'.
        // @ts-ignore
        if (isExisty(namePart) && namePart.length > 0) {
          // @ts-ignore
          name = namePart[0].replace(/^\"|\"$/g, "")
        }
        return {
          email: from_email_address,
          name,
        }
      },
    },
    body: {
      description:
        "Unaltered text if possible, otherwise `body`: a parsed/sanitized version from Sendgrid.",
      type: GraphQLString,
      resolve: ({
        body,
        original_text,
        conversation_initial_message,
        is_first_message,
      }) => {
        if (is_first_message) {
          if (!conversation_initial_message) {
            return null
          }
          return conversation_initial_message
        }
        if (original_text) {
          return original_text
        }
        return body
      },
    },
    deliveries: {
      type: new GraphQLList(DeliveryType),
    },
    attachments: {
      type: new GraphQLList(AttachmentType),
    },
    isMessageSentOnPlatform: {
      description:
        "True if message was sent on the platform. False if sent via an email client.",
      type: GraphQLBoolean,
      resolve: ({ sent_at }) => !!sent_at,
    },
    createdAt: date(),
    sentAt: date(),
    to: {
      description: "Masked emails w/ display name of the recipients.",
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
    },
    cc: {
      description: "Masked emails w/ display name of the recipients in copy.",
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
    },
  },
})
