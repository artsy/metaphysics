import { GraphQLFieldConfig, GraphQLInt, GraphQLString } from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "./fields/pagination"
import {
  identityVerificationConnection,
  IdentityVerificationType,
} from "./identity_verification"

type: connectionWithCursorInfo({ nodeType: IdentityVerificationType })
  .connectionType

export const identityVerifications: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  description: "A connection of identity verifications.",
  type: identityVerificationConnection.connectionType,
  args: pageable({
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
    userId: { type: GraphQLString },
    email: { type: GraphQLString },
  }),
  resolve: async (
    _root,
    args: CursorPageable,
    { identityVerificationsLoader }
  ) => {
    if (!identityVerificationsLoader) return

    const gravityArgs = convertConnectionArgsToGravityArgs(args)
    const { page, size, offset } = gravityArgs

    const { body, headers } = await identityVerificationsLoader({
      total_count: true,
      page,
      size,
      user_id: args.userId,
      email: args.email,
    })

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({
      args,
      body,
      offset,
      page,
      size,
      totalCount,
    })
  },
}
