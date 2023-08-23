import { GraphQLFieldConfig, GraphQLList, GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { VerifiedRepresentativeType } from "schema/v2/verifiedRepresentative/verifiedRepresentative"

const VerifiedRepresentatives: GraphQLFieldConfig<
  { _id: string },
  ResolverContext
> = {
  type: new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(VerifiedRepresentativeType))
  ),
  resolve: async ({ _id }, options, { verifiedRepresentativesLoader }) => {
    try {
      const response = await verifiedRepresentativesLoader(
        { artist_id: _id },
        options
      )

      if (!response || !Array.isArray(response)) {
        throw new Error("Invalid response from verifiedRepresentativesLoader.")
      }

      return response
    } catch (error) {
      throw new Error(
        `Error retrieving verified representatives: ${error.message}`
      )
    }
  },
}

export default VerifiedRepresentatives
