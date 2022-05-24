import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLFieldConfig,
} from "graphql"
import { InternalIDFields } from "schema/v2/object_identification"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import {
  connectionDefinitions,
  cursorForObjectInConnection,
} from "graphql-relay"
import { ResolverContext } from "types/graphql"

const CreditCardMutationSuccessType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CreditCardMutationSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    creditCard: {
      type: CreditCard.type,
      resolve: (creditCard) => creditCard,
    },
    creditCardEdge: {
      type: CreditCardEdge,
      resolve: (creditCard) => {
        return {
          cursor: cursorForObjectInConnection([creditCard], creditCard),
          node: creditCard,
        }
      },
    },
  }),
})

const CreditCardMutationFailureType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "CreditCardMutationFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
  }),
})

export const CreditCardMutationType = new GraphQLUnionType({
  name: "CreditCardMutationType",
  types: [CreditCardMutationSuccessType, CreditCardMutationFailureType],
})

export const CreditCardType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreditCard",
  fields: () => ({
    ...InternalIDFields,
    brand: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Brand of credit card",
    },
    name: {
      type: GraphQLString,
      description: "Name on the credit card",
    },
    lastDigits: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Last four digits on the credit card",
      resolve: ({ last_digits }) => last_digits,
    },
    expirationMonth: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Credit card's expiration month",
      resolve: ({ expiration_month }) => expiration_month,
    },
    expirationYear: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Credit card's expiration year",
      resolve: ({ expiration_year }) => expiration_year,
    },
    street1: {
      type: GraphQLString,
      description: "Billing address street1",
    },
    street2: {
      type: GraphQLString,
      description: "Billing address street2",
    },
    city: {
      type: GraphQLString,
      description: "Billing address city",
    },
    state: {
      type: GraphQLString,
      description: "Billing address state",
    },
    country: {
      type: GraphQLString, // TODO: We may make this type more strict by throwing ISO "ALPHA-2 Codes
      description: "Billing address country code",
    },
    postalCode: {
      type: GraphQLString,
      description: "Billing address postal code",
      resolve: ({ postal_code }) => postal_code,
    },
  }),
})

export const {
  connectionType: CreditCardConnection,
  edgeType: CreditCardEdge,
} = connectionDefinitions({
  nodeType: CreditCardType,
})

export const CreditCard: GraphQLFieldConfig<void, ResolverContext> = {
  type: CreditCardType,
  description: "A user's credit card",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the Credit Card",
    },
  },
  resolve: (_root, { id }, { creditCardLoader }) =>
    creditCardLoader ? creditCardLoader(id) : null,
}
