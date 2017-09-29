// @ts-check
import { GraphQLString, GraphQLObjectType } from "graphql"

import Gemini from "./gemini"
import Convection from "./convection"

const ServicesSchema = new GraphQLObjectType({
  name: "Services",
  fields: () => ({
    gemini: {
      type: Gemini.type,
    },
    convection: {
      type: Convection.type,
    },
  }),
})

const Services = {
  type: ServicesSchema,
  description: "The schema for difference microservice settings",
  args: {},
  resolve: () => ({
    gemini: Gemini.resolve(),
    convection: Convection.resolve(),
  }),
}

export default Services
