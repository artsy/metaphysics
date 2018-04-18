import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GravityIDFields } from "schema/object_identification"

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

export default mutationWithClientMutationId({
  name: "CreditCard",
  decription: "Create a credit card",
  inputFields: {
    token: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    credit_card: {
      type: CreditCardType,
      resolve: credit_card => credit_card,
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
  },
})
