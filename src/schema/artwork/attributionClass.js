import { GraphQLObjectType, GraphQLString, GraphQLNonNull } from "graphql"

const AttributionClass = new GraphQLObjectType({
  name: "AttributionClass",
  description: "Collection of fields that describe attribution class",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    name: {
      type: GraphQLString,
      description: "Shortest form of attribution class display",
    },
    info: {
      type: GraphQLString,
      description:
        "Descriptive phrase used as companion for attribution class name display",
    },
    short_description: {
      type: GraphQLString,
      description: "Longer version of attribution class display",
    },
    long_description: {
      type: GraphQLString,
      description:
        "Long descriptive phrase used as companion for short_description",
    },
  },
})

export default AttributionClass
