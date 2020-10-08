import { pageable, getPagingParameters } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import { PartnerType } from "schema/v2/partner"

export const FollowedGalleryConnection = connectionDefinitions({
  name: "FollowedGallery",
  nodeType: PartnerType,
})

export const GALLERY_OWNER_TYPE = "Gallery"

const FollowedGalleries: GraphQLFieldConfig<void, ResolverContext> = {
  type: FollowedGalleryConnection.connectionType,
  args: pageable({}),
  description:
    "A list of the current user’s currently followed gallery profiles",
  resolve: (_root, options, { followedPartnersLoader }) => {
    if (!followedPartnersLoader) return null

    const { limit: size, offset } = getPagingParameters(options)
    const gravityArgs = {
      size,
      offset,
      total_count: true,
      ownerType: GALLERY_OWNER_TYPE,
    }

    return followedPartnersLoader(gravityArgs).then(({ body, headers }) => {
      return connectionFromArraySlice(body, options, {
        arrayLength: parseInt(headers["x-total-count"] || "0", 10),
        sliceStart: offset,
        resolveNode: (follow_profile) => follow_profile.profile.owner,
      })
    })
  },
}

export default FollowedGalleries
