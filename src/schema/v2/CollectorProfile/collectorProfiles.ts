import { GraphQLFieldConfig, GraphQLID, GraphQLString } from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../fields/pagination"
import { CollectorProfileType } from "./collectorProfile"

export const CollectorProfilesConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: connectionWithCursorInfo({
    nodeType: CollectorProfileType,
  }).connectionType,
  args: pageable({
    partnerID: {
      type: GraphQLID,
    },
    term: {
      type: GraphQLString,
      description: "Term used for searching collector profiles",
    },
  }),
  description:
    "A list of collector profiles that have sent an inquiry to a partner",
  resolve: async (
    _root,
    { term, partnerID, ...args },
    { collectorProfilesLoader }
  ) => {
    if (!collectorProfilesLoader)
      throw new Error(
        "A X-Access-Token header is required to perform this action."
      )

    if (!partnerID || !term) {
      throw new Error("Arguments `partnerID` and `term` are required.")
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
    const { body, headers } = await collectorProfilesLoader({
      inquired_partner_id: partnerID,
      name_contains: term,
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
