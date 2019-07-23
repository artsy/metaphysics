import { GraphQLObjectType, GraphQLNonNull, GraphQLFieldConfig } from "graphql"

import Convection from "./convection"
import Metaphysics from "./metaphysics"
import { ResolverContext } from "types/graphql"

const ServicesSchema = new GraphQLObjectType<any, ResolverContext>({
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

const Services: GraphQLFieldConfig<void, ResolverContext> = {
  type: ServicesSchema,
  description: "The schema for difference micro-service settings",
  args: {},
  resolve: () => ({
    convection: Convection.resolve(),
    metaphysics: Metaphysics.resolve(),
  }),
}

export default Services
