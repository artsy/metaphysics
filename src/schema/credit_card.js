import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
} from "graphql"
import { GravityIDFields } from "schema/object_identification"

const CreditCardType = new GraphQLObjectType({
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
      type: GraphQLNonNull(GraphQLString),
      description: "Last four digits on the credit card",
    },
    expiration_month: {
      type: GraphQLNonNull(GraphQLInt),
      description: "Credit card's expiration month",
    },
    expiration_year: {
      type: GraphQLNonNull(GraphQLInt),
      description: "Credit card's expiration year",
    },
  }),
})

export const CreditCard = {
  type: CreditCardType,
  description: "A user's credit card",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the Credit Card",
    },
  },
  resolve: (root, { id }, request, { rootValue: { creditCardLoader } }) =>
    creditCardLoader(id),
}
