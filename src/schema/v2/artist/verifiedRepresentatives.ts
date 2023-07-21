import { GraphQLFieldConfig, GraphQLList } from "graphql"
import { ResolverContext } from "types/graphql"
import { PartnerType } from "schema/v2/partner/partner"

const VerifiedRepresentatives: GraphQLFieldConfig<
  { _id: string },
  ResolverContext
> = {
  type: GraphQLList(PartnerType),
  resolve: async (
    { _id },
    options,
    { verifiedRepresentativesLoader, partnersLoader }
  ) => {
    if (!verifiedRepresentativesLoader) {
      throw new Error("You are not authorized to perform this action.")
    }
    try {
      const verifiedRepresentatives = await verifiedRepresentativesLoader(
        { artist_id: _id },
        options
      )

      if (!verifiedRepresentatives || !Array.isArray(verifiedRepresentatives)) {
        throw new Error("Invalid response from verifiedRepresentativesLoader.")
      }

      const partnerIds = verifiedRepresentatives.map(
        ({ partner_id }) => partner_id
      )

      if (!Array.isArray(partnerIds) || partnerIds.length === 0) {
        return []
      }

      const response = await partnersLoader({ ids: partnerIds })

      if (!response || !response.body || !Array.isArray(response.body)) {
        throw new Error("Invalid response from partnersLoader.")
      }

      return response.body
    } catch (error) {
      throw new Error(
        `Error retrieving verified representatives: ${error.message}`
      )
    }
  },
}

export default VerifiedRepresentatives
