import GeneFamily from "./gene_family"
import { GraphQLList } from "graphql"

const GeneFamilies = {
  type: new GraphQLList(GeneFamily.type),
  description: "A list of Gene Families",
  resolve: (_source, _args, _request, { rootValue }) => {
    return rootValue.geneFamiliesLoader()
  },
}

export default GeneFamilies
