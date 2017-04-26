import type { GraphQLFieldConfig } from "graphql"
import { GraphQLObjectType, GraphQLString, GraphQLList } from "graphql"
import Gene from "./gene"

const GeneFamilyType = new GraphQLObjectType({
  name: "GeneFamily",
  fields: {
    id: {
      type: GraphQLString,
    },
    name: {
      type: GraphQLString,
    },
    genes: {
      type: new GraphQLList(Gene.type),
    },
  },
})

const GeneFamily: GraphQLFieldConfig<GeneFamilyType, *> = {
  type: GeneFamilyType,
  resolve: () => {
    return root => root
  },
}

export default GeneFamily
