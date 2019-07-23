import {
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLFieldConfig,
} from "graphql"
import Gene from "schema/v2/gene"
import { ResolverContext } from "types/graphql"

const GeneMatch: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(Gene.type),
  description: "A Search for Genes",
  args: {
    term: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Your search term",
    },
    size: {
      type: GraphQLInt,
      description: "Maximum number of items to retrieve. Default: 5.",
    },
    page: {
      type: GraphQLInt,
      description: "Page to retrieve. Default: 1.",
    },
    exclude_ids: {
      type: new GraphQLList(GraphQLString),
      description: "Exclude these MongoDB ids from results",
    },
  },
  resolve: (_root, options, { matchGeneLoader }) => matchGeneLoader(options),
}

export default GeneMatch
