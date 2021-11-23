import { pageable } from "relay-cursor-paging"
import {
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { ProfileType } from "schema/v2/profile"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../fields/pagination"
import { InternalIDFields } from "../object_identification"

const FollowedProfileType = new GraphQLObjectType<any, ResolverContext>({
  name: "FollowedProfile",
  fields: {
    profile: { type: new GraphQLNonNull(ProfileType) },
    ...InternalIDFields,
  },
})

export const followedProfiles: GraphQLFieldConfig<any, ResolverContext> = {
  type: connectionWithCursorInfo({
    name: "FollowedProfile",
    nodeType: FollowedProfileType,
  }).connectionType,
  args: pageable({
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
  }),
  description:
    "A list of the current user’s currently followed partner profiles",
  resolve: async (_root, args, { followedPartnersLoader }) => {
    if (!followedPartnersLoader) return null

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await followedPartnersLoader({
      size,
      offset,
      total_count: true,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({
      totalCount,
      offset,
      page,
      size,
      body,
      args,
    })
  },
}
