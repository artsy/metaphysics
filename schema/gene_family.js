import type { GraphQLFieldConfig } from "graphql"
import { GraphQLObjectType, GraphQLString } from "graphql"

const GeneFamilyType = new GraphQLObjectType({
  name: "GeneFamily",
  fields: {
    foo: {
      type: GraphQLString,
    },
  },
})

const GeneFamily: GraphQLFieldConfig<GeneFamilyType, *> = {
  type: GeneFamilyType,
  resolve: () => {
    return { foo: "foo" }
  },
}

export default GeneFamily
