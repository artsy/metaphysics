// @ts-check
import { GraphQLObjectType, GraphQLNonNull } from "graphql"

import Convection from "./convection"

const ServicesSchema = new GraphQLObjectType({
  name: "Services",
  fields: () => ({
    convection: {
      type: new GraphQLNonNull(Convection.type),
    },
  }),
})

const Services = {
  type: ServicesSchema,
  description: "The schema for difference microservice settings",
  args: {},
  resolve: () => ({
    convection: Convection.resolve(),
  }),
}

export default Services
