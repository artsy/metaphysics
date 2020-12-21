import { GraphQLObjectType, GraphQLString } from "graphql"
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
