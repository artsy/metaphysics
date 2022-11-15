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
import { GravityIDFields } from "schema/v2/object_identification"
import { BodyAndHeaders, ResponseHeaders } from "lib/loaders"

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
    size: {
      type: new GraphQLNonNull(GraphQLInt),
      deprecationReason: "Prefer `filesize`",
    },
    publicURL: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ uri }) => `${config.GRAVITY_API_BASE}/${uri}`,
    },
    publicUrl: {
      type: new GraphQLNonNull(GraphQLString),
      deprecationReason: "Prefer `publicURL`",
      resolve: ({ uri }) => `${config.GRAVITY_API_BASE}/${uri}`,
    },
  },
})
interface GravityArgs {
  document_ids?: string[]
  offset: number
  size: number
  total_count: boolean
}

const FILTER_KEYS = ["documentIDs", "artistID", "showID"]

export const PartnerDocumentsConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  description: "Return partner documents if current user has CMS access.",
  type: connectionWithCursorInfo({
    nodeType: PartnerDocumentType,
  }).connectionType,
  args: pageable({
    documentIDs: {
      type: new GraphQLList(GraphQLString),
      description: "Filter documents by ID.",
    },
    artistID: {
      type: GraphQLString,
    },
    showID: {
      type: GraphQLString,
    },
  }),
  resolve: async (
    { _id: partnerID },
    args,
    {
      partnerDocumentsLoader,
      partnerArtistDocumentsLoader,
      partnerShowDocumentsLoader,
    }
  ) => {
    if (
      !partnerArtistDocumentsLoader ||
      !partnerArtistDocumentsLoader ||
      !partnerShowDocumentsLoader
    ) {
      return null
    }

    if (
      Object.keys(args).filter((key) => FILTER_KEYS.includes(key)).length > 1
    ) {
      throw Error("Only one filter arg supported at a time.")
    }
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
    const gravityArgs: GravityArgs = {
      size,
      offset,
      total_count: true,
    }

    let response: BodyAndHeaders<any, ResponseHeaders> = {
      body: undefined,
      headers: {},
    }

    const { artistID, showID, documentIDs } = args

    if (artistID) {
      response = await partnerArtistDocumentsLoader(
        { artistID, partnerID },
        gravityArgs
      )
    } else if (showID) {
      response = await partnerShowDocumentsLoader(
        { showID, partnerID },
        gravityArgs
      )
    } else {
      if (documentIDs) {
        gravityArgs.document_ids = flatten([args.documentIDs])
      }

      response = await partnerDocumentsLoader!(partnerID, gravityArgs)
    }

    const { headers, body } = response
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
