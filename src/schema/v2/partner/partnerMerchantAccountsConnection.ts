import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { GravityIDFields } from "schema/v2/object_identification"

export const PartnerMerchantAccountType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PartnerMerchantAccount",
  fields: {
    ...GravityIDFields,
    externalId: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ external_id }) => external_id,
    },
  },
})

interface GravityArgs {
  total_count: boolean
}

export const PartnerMerchantAccountsConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  description: "Return partner merchant accounts.",
  type: connectionWithCursorInfo({
    nodeType: PartnerMerchantAccountType,
  }).connectionType,
  args: pageable({}),
  resolve: async (
    { _id: partnerID },
    args,
    { partnerMerchantAccountsLoader }
  ) => {
    if (!partnerMerchantAccountsLoader) {
      return null
    }

    const gravityArgs: GravityArgs = {
      total_count: true,
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { headers, body } = await partnerMerchantAccountsLoader(
      {
        partnerId: partnerID,
      },
      gravityArgs
    )

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
