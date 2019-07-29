import { GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GeneType } from "../gene"
import { ResolverContext } from "types/graphql"

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "FollowGene",
  description: "Follow (or unfollow) an gene",
  inputFields: {
    gene_id: { type: GraphQLString },
  },
  outputFields: {
    gene: {
      type: GeneType,
      resolve: ({ gene }, _options, { geneLoader }) => geneLoader(gene.id),
    },
  },
  mutateAndGetPayload: (options, { followGeneLoader }) => {
    if (!followGeneLoader) {
      throw new Error("Missing Follow Gene Loader. Check your access token.")
    }
    return followGeneLoader(options)
  },
})
