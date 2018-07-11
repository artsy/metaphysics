import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GravityIDFields } from "schema/object_identification"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

export const CreditCardType = new GraphQLObjectType({
  name: "CreditCard",
  fields: () => ({
    ...GravityIDFields,
    brand: {
      type: GraphQLString,
      description: "Brand of credit card",
    },
    name: {
      type: GraphQLString,
      description: "Name on the credit card",
    },
    last_digits: {
      type: GraphQLString,
      description: "Last four digits on the credit card",
    },
    expiration_month: {
      type: GraphQLInt,
      description: "Credit card's expiration month",
    },
    expiration_year: {
      type: GraphQLInt,
      description: "Credit card's expiration year",
    },
  }),
})

export const CreditCardMutationSuccessType = new GraphQLObjectType({
  name: "CreditCardMutationSuccess",
  isTypeOf: data => data.id,
  fields: () => ({
    creditCard: {
      type: CreditCardType,
      resolve: creditCard => creditCard,
    },
  }),
})

export const CreditCardMutationFailureType = new GraphQLObjectType({
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

export default mutationWithClientMutationId({
  name: "CreditCard",
  description: "Create a credit card",
  inputFields: {
    token: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    credit_card: {
      type: CreditCardType,
      deprecationReason: "Favor `creditCardOrError`",
      resolve: result => {
        return result && result.id ? result : null
      },
    },
    creditCardOrError: {
      type: CreditCardMutationType,
      resolve: result => result,
    },
  },
  mutateAndGetPayload: (
    { token },
    request,
    { rootValue: { accessToken, createCreditCardLoader } }
  ) => {
    if (!accessToken) {
      return new Error("You need to be signed in to perform this action")
    }

    return createCreditCardLoader({ token, provider: "stripe" })
      .then(result => result)
      .catch(error => {
        const formattedErr = formatGravityError(error)
        if (formattedErr) {
          return { ...formattedErr, _type: "GravityMutationError" }
        } else {
          return new Error(error)
        }
      })
  },
})
