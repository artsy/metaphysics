import { GraphQLObjectType, GraphQLString, GraphQLNonNull } from "graphql"
import date from "schema/v2/fields/date"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "schema/v2/object_identification"

export const DeliveryType = new GraphQLObjectType<any, ResolverContext>({
  name: "Delivery",
  description: "Fields of a delivery (currently from Radiation)",
  fields: {
    ...InternalIDFields,
    fullTransformedEmail: {
      description: "Masked email w/ display name.",
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ full_transformed_email }) => full_transformed_email,
    },
    deliveredAt: date,
    bouncedAt: date,
    openedAt: date,
    clickedAt: date,
  },
})
