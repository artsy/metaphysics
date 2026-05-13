import { PartnerType } from "schema/v2/partner/partner"
import { FairType } from "./fair"
import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const VanityURLEntityType = new GraphQLUnionType({
  name: "VanityURLEntityType",
  types: [FairType, PartnerType],
  resolveType(value, _context, _info) {
    switch (value.context_type) {
      case "Partner":
        return PartnerType
      case "Fair":
        return FairType
      default:
        throw new Error(`Unknown context type: ${value.context_type}`)
    }
  },
})

const VanityURLEntity: GraphQLFieldConfig<void, ResolverContext> = {
  type: VanityURLEntityType,
  description: "A Partner or Fair",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Profile to get a partner or fair for",
    },
  },
  resolve: (_root, { id }, { profileLoader, partnerLoader, fairLoader }) =>
    profileLoader(id).then((profile) => {
      switch (profile.owner_type) {
        case "PartnerArtistDocument":
        case "PartnerAuction":
        case "PartnerBrand":
        case "PartnerDemo":
        case "PartnerGallery":
        case "PartnerInstitution":
        case "PartnerInstitutionalSeller":
        case "PartnerPrivateCollector":
        case "PartnerPrivateDealer":
          return partnerLoader(profile.owner.id).then((partner) => {
            return { ...partner, context_type: "Partner" }
          })
        case "Fair":
          return fairLoader(profile.owner.id).then((fair) => {
            return { ...fair, context_type: "Fair" }
          })
        case "FairOrganizer":
          return fairLoader(profile.owner.default_fair_id).then((fair) => {
            return { ...fair, context_type: "Fair" }
          })
        default:
          throw new Error(`Unrecognized profile type: ${profile.owner_type}`)
      }
    }),
}

export default VanityURLEntity
