// @ts-check
import { GraphQLObjectType, GraphQLNonNull } from "graphql"

import Convection from "./convection"

const ServicesSchema = new GraphQLObjectType({
  name: "Services",
  fields: () => {return {
    convection: {
      type: new GraphQLNonNull(Convection.type),
    },
  }},
})

const Services = {
  type: ServicesSchema,
  description: "The schema for difference microservice settings",
  args: {},
  resolve: () => {return {
    convection: Convection.resolve(),
  }},
}

export default Services
