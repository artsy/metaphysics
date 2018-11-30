import { GraphQLObjectType, GraphQLString, GraphQLNonNull } from "graphql"
import date from "../../fields/date"

export const DeliveryType = new GraphQLObjectType({
  name: "Delivery",
  description: "Fields of a delivery (currently from Radiation)",
  fields: {
    id: {
      description: "Delivery id.",
      type: new GraphQLNonNull(GraphQLString),
    },
    full_transformed_email: {
      description: "Masked email w/ display name.",
      type: new GraphQLNonNull(GraphQLString),
    },
    delivered_at: date,
    bounced_at: date,
    opened_at: date,
    clicked_at: date,
  },
})
