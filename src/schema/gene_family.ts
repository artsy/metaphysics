import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import Gene from "./gene"

const GeneFamilyType = new GraphQLObjectType<ResolverContext>({
  name: "GeneFamily",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    genes: {
      type: new GraphQLList(Gene.type),
    },
  },
})

const GeneFamily = {
  type: GeneFamilyType,
}

export default GeneFamily
