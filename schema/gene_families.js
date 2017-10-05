import GeneFamily from "./gene_family"
import { GraphQLList, GraphQLInt } from "graphql"

const GeneFamilies = {
  type: new GraphQLList(GeneFamily.type),
  description: "A list of Gene Families",
  args: {
    page: {
      type: GraphQLInt,
    },
    size: {
      type: GraphQLInt,
    },
  },
  resolve: (_source, options, _request, { rootValue }) => {
    const gravityOptions = Object.assign({}, options, { sort: "position" })
    return rootValue.geneFamiliesLoader(gravityOptions)
  },
}

export default GeneFamilies
