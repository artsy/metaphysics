import { GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GeneType } from "../gene"

export default mutationWithClientMutationId({
  name: "FollowGene",
  description: "Follow (or unfollow) an gene",
  inputFields: {
    gene_id: { type: GraphQLString },
  },
  outputFields: {
    gene: {
      type: GeneType,
      resolve: ({ gene }, options, request, { rootValue: { geneLoader } }) =>
        geneLoader(gene.id),
    },
  },
  mutateAndGetPayload: (
    options,
    request,
    { rootValue: { followGeneLoader } }
  ) => {
    if (!followGeneLoader) {
      throw new Error("Missing Follow Gene Loader. Check your access token.")
    }
    return followGeneLoader(options)
  },
})
