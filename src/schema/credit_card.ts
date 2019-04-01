import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLFieldConfig,
} from "graphql"
import { GravityIDFields } from "schema/object_identification"
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
  isTypeOf: data => data.id,
  fields: () => ({
    creditCard: {
      type: CreditCard.type,
      resolve: creditCard => creditCard,
    },
    creditCardEdge: {
      type: CreditCardEdge,
      resolve: creditCard => {
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
  isTypeOf: data => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: err => err,
    },
  }),
})

export const CreditCardMutationType = new GraphQLUnionType({
  name: "CreditCardMutationType",
  types: [CreditCardMutationSuccessType, CreditCardMutationFailureType],
})

const CreditCardType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreditCard",
  fields: () => ({
    ...GravityIDFields,
    brand: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Brand of credit card",
    },
    name: {
      type: GraphQLString,
      description: "Name on the credit card",
    },
    last_digits: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Last four digits on the credit card",
    },
    expiration_month: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Credit card's expiration month",
    },
    expiration_year: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Credit card's expiration year",
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
    postal_code: {
      type: GraphQLString,
      description: "Billing address postal code",
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
