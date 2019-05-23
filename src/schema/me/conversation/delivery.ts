import { GraphQLObjectType, GraphQLString, GraphQLNonNull } from "graphql"
import date from "../../fields/date"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "schema/object_identification"

export const DeliveryType = new GraphQLObjectType<any, ResolverContext>({
  name: "Delivery",
  description: "Fields of a delivery (currently from Radiation)",
  fields: {
    ...InternalIDFields,
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
