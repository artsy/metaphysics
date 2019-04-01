import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLFieldConfig,
} from "graphql"
import { amount } from "../../fields/money"
import { IDFields, NodeInterface } from "../../object_identification"
import { ResolverContext } from "types/graphql"

const InvoiceState = new GraphQLEnumType({
  name: "InvoiceState",
  values: {
    UNPAID: {
      value: "unpaid",
    },
    PAID: {
      value: "paid",
    },
    VOID: {
      value: "void",
    },
    REFUNDED: {
      value: "refunded",
    },
  },
})

export const InvoiceType = new GraphQLObjectType<any, ResolverContext>({
  name: "Invoice",
  description: "Fields of an invoice (currently from Lewitt)",
  interfaces: [NodeInterface],
  fields: {
    ...IDFields,
    lewitt_invoice_id: {
      description: "Lewitt's invoice id.",
      type: new GraphQLNonNull(GraphQLString),
    },
    payment_url: {
      description: "Link to public checkout page.",
      type: GraphQLString,
    },
    state: {
      description: "Current state of invoice.",
      type: InvoiceState,
    },
    total: amount(({ total_cents }) => total_cents),
  },
})

const Invoice: GraphQLFieldConfig<void, ResolverContext> = {
  type: InvoiceType,
  description: "An invoice",
  args: {
    conversationId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the Conversation",
    },
    invoiceId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the invoice",
    },
  },
  resolve: (
    _root,
    { conversationId, invoiceId },
    { conversationInvoiceLoader }
  ) => {
    if (!conversationInvoiceLoader) return null
    return conversationInvoiceLoader({
      conversation_id: conversationId,
      lewitt_invoice_id: invoiceId,
    })
  },
}

export default Invoice
