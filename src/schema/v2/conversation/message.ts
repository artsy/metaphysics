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
import { InvoiceType } from "./invoice"
import { isExisty } from "lib/helpers"
import { ResolverContext } from "types/graphql"
import { deprecate } from "lib/deprecation"

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

const isInvoiceMessage = (metadata) => {
  return !!metadata && isExisty(metadata.lewitt_invoice_id)
}

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
    invoice: {
      type: InvoiceType,
      deprecationReason: deprecate({
        inVersion: 2,
        reason:
          "Payment Request was deprecated. The field was kept for legacy client support.",
      }),
      resolve: () => null,
    },
    isInvoice: {
      description: "True if message is an invoice message",
      type: GraphQLBoolean,
      deprecationReason: deprecate({
        inVersion: 2,
        reason:
          "Payment Request was deprecated. The field was kept for legacy client support.",
      }),
      resolve: ({ metadata }) => isInvoiceMessage(metadata),
    },
    createdAt: date(),
  },
})
