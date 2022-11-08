import config from "config"
import {
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { flatten } from "lodash"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { GravityIDFields } from "./object_identification"

export const PartnerDocumentType = new GraphQLObjectType<any, ResolverContext>({
  name: "PartnerDocument",
  fields: {
    ...GravityIDFields,
    title: {
      type: new GraphQLNonNull(GraphQLString),
    },
    filesize: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: ({ size }) => size,
    },
    publicURL: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ uri }) => `${config.GRAVITY_API_BASE}/${uri}`,
    },
  },
})

export const PartnerDocumentsConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  description: "Retrieve all partner documents for a given partner",
  type: connectionWithCursorInfo({
    name: "PartnerDocumentsConnection",
    nodeType: PartnerDocumentType,
  }).connectionType,
  args: pageable({
    documentIDs: {
      type: new GraphQLList(GraphQLString),
      description: "Return only document(s) included in this list of IDs.",
    },
  }),
  resolve: async ({ _id: partnerID }, args, { partnerDocumentsLoader }) => {
    if (!partnerDocumentsLoader) {
      return null
    }
    interface GravityArgs {
      document_ids?: string[]
      offset: number
      size: number
      total_count: boolean
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
    const gravityArgs: GravityArgs = {
      size,
      offset,
      total_count: true,
    }

    if (args.documentIDs) {
      gravityArgs.document_ids = flatten([args.documentIDs])
    }

    const { body, headers } = await partnerDocumentsLoader(
      partnerID,
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
