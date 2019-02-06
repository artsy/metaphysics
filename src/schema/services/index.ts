import { GraphQLObjectType, GraphQLNonNull } from "graphql"

import Convection from "./convection"
import Metaphysics from "./metaphysics"

const ServicesSchema = new GraphQLObjectType<ResolverContext>({
  name: "Services",
  fields: () => ({
    convection: {
      type: new GraphQLNonNull(Convection.type),
    },
    metaphysics: {
      type: new GraphQLNonNull(Metaphysics.type),
    },
  }),
})

const Services = {
  type: ServicesSchema,
  description: "The schema for difference micro-service settings",
  args: {},
  resolve: () => ({
    convection: Convection.resolve(),
    metaphysics: Metaphysics.resolve(),
  }),
}

export default Services
