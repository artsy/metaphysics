import gravity from "../lib/loaders/gravity"
import GeneFamily from "./gene_family"
import { GraphQLList } from "graphql"

const GeneFamilies = {
  type: new GraphQLList(GeneFamily.type),
  description: "A list of Gene Families",
  resolve: () => gravity("gene_families"),
}

export default GeneFamilies
