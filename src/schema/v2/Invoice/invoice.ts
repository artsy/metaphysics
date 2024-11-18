import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { amount } from "schema/v2/fields/money"
import { InternalIDFields } from "schema/v2/object_identification"
import { date } from "schema/v2/fields/date"
import { CreditCardType } from "schema/v2/credit_card"

const InvoiceState = new GraphQLEnumType({
  name: "InvoiceState",
  values: {
    DRAFT: {
      value: "draft",
    },
    READY: {
      value: "ready",
    },
    PAID: {
      value: "paid",
    },
    CANCELED: {
      value: "canceled",
    },
  },
})

const InvoiceLineItemType = new GraphQLObjectType<any, ResolverContext>({
  name: "InvoiceLineItem",
  fields: {
    ...InternalIDFields,
    subtotal: amount(({ subtotal_cents }) => subtotal_cents),
    description: {
      type: new GraphQLNonNull(GraphQLString),
    },
    quantity: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    amount: amount(({ amount_cents }) => amount_cents),
  },
})

export const InvoicePaymentType = new GraphQLObjectType<any, ResolverContext>({
  name: "InvoicePayment",
  fields: {
    ...InternalIDFields,
    successful: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    createdAt: date(({ created_at }) => created_at),
    amount: amount(({ amount_cents }) => amount_cents),
    creditCard: {
      type: CreditCardType,
      resolve: ({ credit_card }) => credit_card,
    },
  },
})

const InvoiceType = new GraphQLObjectType<any, ResolverContext>({
  name: "Invoice",
  fields: {
    ...InternalIDFields,
    number: {
      type: new GraphQLNonNull(GraphQLString),
    },
    state: {
      type: new GraphQLNonNull(InvoiceState),
    },
    readyAt: date(({ ready_at }) => ready_at),
    name: {
      type: GraphQLString,
    },
    email: {
      type: GraphQLString,
    },
    lineItems: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(InvoiceLineItemType))
      ),
      resolve: ({ line_items }) => line_items,
    },
    payments: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(InvoicePaymentType))
      ),
      resolve: ({ payments }) => payments,
    },
    remaining: amount(({ remaining_cents }) => remaining_cents),
    remainingMinor: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ remaining_cents }) => remaining_cents,
    },
    externalNote: {
      type: GraphQLString,
      resolve: ({ external_note }) => external_note,
    },
    currency: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
})

export const Invoice: GraphQLFieldConfig<void, ResolverContext> = {
  type: InvoiceType,
  args: {
    token: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (_root, { token }, { invoicesLoader }) => {
    return invoicesLoader({ token })
  },
}
