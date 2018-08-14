import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { CreditCard } from "../credit_card"

export const CreditCardMutationSuccessType = new GraphQLObjectType({
  name: "CreditCardMutationSuccess",
  isTypeOf: data => data.id,
  fields: () => ({
    creditCard: {
      type: CreditCard.type,
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
      type: CreditCard.type,
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
      throw new Error("You need to be signed in to perform this action")
    }

    return createCreditCardLoader({ token, provider: "stripe" })
      .then(result => result)
      .catch(error => {
        const formattedErr = formatGravityError(error)
        if (formattedErr) {
          return { ...formattedErr, _type: "GravityMutationError" }
        } else {
          throw new Error(error)
        }
      })
  },
})
