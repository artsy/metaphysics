import type { GraphQLFieldResolver } from "graphql"
import type { ResolverContext } from "types/graphql"
import { PartnersConnection, PartnerSorts } from "../partner/partners"
import PartnerClassification from "../input_fields/partner_type_type"

/*
 * Resolvers for home view partner sections
 */

export const GalleriesNearYouResolver: GraphQLFieldResolver<
  any,
  ResolverContext
> = async (parent, args, context, info) => {
  const finalArgs = {
    ...args,
    eligibleForListing: true,
    excludeFollowedPartners: true,
    includePartnersNearIpBasedLocation: true,
    includePartnersWithFollowedArtists: true,
    defaultProfilePublic: true,
    sort: PartnerSorts.getValue("DISTANCE")?.value,
    maxDistance: 6371, // Earth radius in km to get all results (https://en.wikipedia.org/wiki/Earth_radius?useskin=vector#Mean_radius)
    near: undefined,
    type: PartnerClassification.getValue("GALLERY")?.value,
  }

  const result = await PartnersConnection.resolve!(
    parent,
    finalArgs,
    context,
    info
  )

  return result
}
