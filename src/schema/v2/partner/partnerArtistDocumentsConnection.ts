import { pageable } from "relay-cursor-paging"
import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { paginationResolver } from "schema/v2/fields/pagination"
import { GraphQLFieldConfig } from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"

import { PartnerDocumentType } from "./partnerDocumentsConnection"

export const PartnerArtistDocumentsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  description: "Retrieve all partner documents for a given partner",
  deprecationReason: "Prefer `partner.documentsConnection`",
  type: connectionWithCursorInfo({
    name: "PartnerArtistDocument",
    nodeType: PartnerDocumentType,
  }).connectionType,
  args: pageable({
    artistID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Artist",
    },
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Partner",
    },
    page: {
      type: GraphQLInt,
    },
    size: {
      type: GraphQLInt,
    },
  }),
  resolve: async (_root, args, { partnerArtistDocumentsLoader }) => {
    if (!partnerArtistDocumentsLoader) {
      return null
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
    const gravityOptions = {
      size,
      offset,
      total_count: true,
    }
    const { body, headers } = await partnerArtistDocumentsLoader(
      { artistID: args.artistID, partnerID: args.partnerID },
      gravityOptions
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
