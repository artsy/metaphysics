import config from "config"
import {
  GraphQLFieldConfig,
  GraphQLInt,
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
import { InternalIDFields } from "./object_identification"

const PartnerDocumentType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerDocument",
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
    publicUrl: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ uri }) => `${config.GRAVITY_API_BASE}/${uri}`,
    },
  },
})

export const partnerDocumentsConnection = connectionWithCursorInfo({
  nodeType: PartnerDocumentType,
})

export const PartnerDocumentsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  description: "Retrieve all partner documents for a given partner",
  type: partnerDocumentsConnection.connectionType,
  args: pageable({
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
  resolve: async (_root, args, { partnerDocumentsLoader }) => {
    if (!partnerDocumentsLoader) {
      return null
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
    const gravityOptions = {
      size,
      offset,
      total_count: true,
    }
    const { body, headers } = await partnerDocumentsLoader(
      { partnerId: args.partnerID },
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
