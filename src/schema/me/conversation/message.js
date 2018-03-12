import date from "schema/fields/date"
import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from "graphql"
import { GlobalIDField, NodeInterface } from "schema/object_identification"
import { AttachmentType } from "./attachment"
import { DeliveryType } from "./delivery"
import { InvoiceType } from "./invoice"
import { isExisty } from "lib/helpers"

const MessageInitiatorType = new GraphQLObjectType({
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

const isInvoiceMessage = metadata => {
  return !!metadata && isExisty(metadata.lewitt_invoice_id)
}

export const MessageType = new GraphQLObjectType({
  name: "Message",
  description: "A message in a conversation.",
  interfaces: [NodeInterface],
  fields: {
    __id: GlobalIDField,
    id: {
      description: "Impulse message id.",
      type: new GraphQLNonNull(GraphQLString),
    },
    // This alias exists specifically because our fork of Relay Classic did not yet properly support using `__id`
    // instead of `id`, which lead to Relay overwriting `id` fields with the `__id` value. Thus using a completely
    // different field name works around this. You should probably not use it.
    impulse_id: {
      description: "Impulse message id.",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ id }) => id,
    },
    is_from_user: {
      description: "True if message is from the user to the partner.",
      type: GraphQLBoolean,
      resolve: (
        {
          from_id,
          from_email_address,
          conversation_from_address,
          from_principal,
        },
        options,
        req,
        { rootValue: { userID } }
      ) =>
        from_principal ||
        (userID && from_id === userID) ||
        from_email_address === conversation_from_address,
    },
    from_email_address: {
      type: GraphQLString,
      deprecationReason: "Prefer to use the structured `from` field.",
    },

    from: {
      type: MessageInitiatorType,
      resolve: ({ from, from_email_address }) => {
        const namePartRegex = /"([^"]*)"/
        const namePart = namePartRegex.exec(from)
        let name
        if (isExisty(namePart) && namePart.length > 0) {
          name = namePart[0].replace(/^\"|\"$/g, "")
        }
        return {
          email: from_email_address,
          name,
        }
      },
    },

    raw_text: {
      description: "Full unsanitized text.",
      type: new GraphQLNonNull(GraphQLString),
      deprecationReason: "Prefer to use the parsed/cleaned-up `body`.",
    },

    body: {
      description:
        "Unaltered text if possible, otherwise `body`: a parsed/sanitized version from Sendgrid.",
      type: GraphQLString,
      resolve: ({ body, original_text }) => {
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
      resolve: (
        { metadata, conversation_id },
        options,
        request,
        { rootValue: { conversationInvoiceLoader } }
      ) => {
        if (!isInvoiceMessage(metadata)) {
          return null
        }
        return conversationInvoiceLoader({
          conversation_id,
          lewitt_invoice_id: metadata.lewitt_invoice_id,
        })
      },
    },

    is_invoice: {
      description: "True if message is an invoice message",
      type: GraphQLBoolean,
      resolve: ({ metadata }) => isInvoiceMessage(metadata),
    },
    created_at: date,
  },
})
