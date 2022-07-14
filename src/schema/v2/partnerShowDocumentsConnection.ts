import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLInt,
} from "graphql"
import { InternalIDFields } from "./object_identification"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "./fields/pagination"
import { GraphQLFieldConfig } from "graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

export const PartnerShowDocumentType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PartnerShowDocument",
  fields: {
    ...InternalIDFields,
    uri: {
      type: new GraphQLNonNull(GraphQLString),
    },
    filename: {
      type: new GraphQLNonNull(GraphQLString),
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
    },
    size: {
      type: new GraphQLNonNull(GraphQLInt),
    },
  },
})

export const PartnerShowDocumentsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: connectionWithCursorInfo({
    nodeType: PartnerShowDocumentType,
  }).connectionType,
  description:
    "Retrieve all partner show documents for a given partner and show",
  args: pageable({
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Partner",
    },
    showID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Show",
    },
    page: {
      type: GraphQLInt,
    },
    size: {
      type: GraphQLInt,
    },
  }),
  resolve: async (_root, args, { partnerShowDocumentsLoader }) => {
    if (!partnerShowDocumentsLoader) {
      return null
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
    const gravityOptions = {
      size,
      offset,
      total_count: true,
    }
    const { body, headers } = await partnerShowDocumentsLoader(
      { showId: args.showID, partnerId: args.partnerID },
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
