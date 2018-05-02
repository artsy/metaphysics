import Gene from "./gene"
import { GraphQLList, GraphQLInt } from "graphql"

const Genes = {
  type: new GraphQLList(Gene.type),
  description: "A list of Genes",
  args: {
    size: {
      type: GraphQLInt,
    },
  },
  resolve: (root, options, request, { rootValue: { genesLoader } }) => {
    return genesLoader(options)
  },
}

export default Genes
