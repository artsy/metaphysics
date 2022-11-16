import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLFieldConfig,
} from "graphql"
import { amount } from "schema/v2/fields/money"
import {
  NodeInterface,
  InternalIDFields,
} from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"
import { deprecate, deprecateType } from "lib/deprecation"

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

export const InvoiceType = deprecateType(
  {
    inVersion: 2,
    reason:
      "Payment Request was deprecated. The type was kept for legacy client support.",
  },
  new GraphQLObjectType<any, ResolverContext>({
    name: "Invoice",
    description: "Fields of an invoice (currently from Lewitt)",
    interfaces: [NodeInterface],
    fields: {
      ...InternalIDFields,
      lewittInvoiceID: {
        description: "Lewitt's invoice id.",
        type: new GraphQLNonNull(GraphQLString),
        resolve: ({ lewitt_invoice_id }) => lewitt_invoice_id,
      },
      paymentURL: {
        description: "Link to public checkout page.",
        type: GraphQLString,
        resolve: ({ payment_url }) => payment_url,
      },
      state: {
        description: "Current state of invoice.",
        type: InvoiceState,
      },
      total: amount(({ total_cents }) => total_cents),
    },
  })
)

const Invoice: GraphQLFieldConfig<void, ResolverContext> = {
  type: InvoiceType,
  description: "An invoice",
  deprecationReason: deprecate({
    inVersion: 2,
    reason:
      "Payment Request was deprecated. The field was kept for legacy client support.",
  }),
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
  resolve: () => null,
}

export default Invoice
