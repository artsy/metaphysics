import { GraphQLObjectType, GraphQLString, GraphQLList } from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "schema/v2/object_identification"

const AttributionClass = new GraphQLObjectType<any, ResolverContext>({
  name: "AttributionClass",
  description: "Collection of fields that describe attribution class",
  fields: {
    ...InternalIDFields,
    name: {
      type: GraphQLString,
      description: "Shortest form of attribution class display",
    },
    info: {
      type: GraphQLString,
      deprecationReason: "Prefer `shortDescription`",
    },
    shortDescription: {
      type: GraphQLString,
      description:
        "Short descriptive phrase for attribution class without punctuation",
      resolve: ({ short_description }) => {
        return short_description
      },
    },
    shortArrayDescription: {
      type: new GraphQLList(GraphQLString),
      description:
        "Short descriptive phrase for attribution class without punctuation as array of strings",
      resolve: ({ short_array_description }) => {
        return short_array_description
      },
    },
    longDescription: {
      type: GraphQLString,
      description:
        "Long description (can include multiple sentences) for attribution class",
      resolve: ({ long_description }) => {
        return long_description
      },
    },
  },
})

export default AttributionClass
