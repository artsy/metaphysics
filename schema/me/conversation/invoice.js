import { GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLEnumType } from "graphql"
import { amount } from "../../fields/money"

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

export const InvoiceType = new GraphQLObjectType({
  name: "Invoice",
  desciption: "Fields of an invoice (currently from Lewitt)",
  fields: {
    id: {
      description: "Impulse's invoice id.",
      type: new GraphQLNonNull(GraphQLString),
    },
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
    total: amount(({ total_cents, symbol }) => total_cents), // eslint-disable-line no-unused-vars
  },
})
