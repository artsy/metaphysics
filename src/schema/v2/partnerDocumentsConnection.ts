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
    interface GravityArgs {
      document_ids?: string[]
      offset: number
      size: number
      total_count: boolean
    }

    const filterKeys = ["documentIDs", "artistID", "showID"]

    if (
      Object.keys(args).filter((key) => filterKeys.includes(key)).length > 1
    ) {
      throw Error("Only one filter arg supported at a time.")
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

    let response: BodyAndHeaders<any, ResponseHeaders> = {
      body: undefined,
      headers: {},
    }

    if (args.artistID) {
      response = await partnerArtistDocumentsLoader!(
        { artistId: args.artistID, partnerId: partnerID },
        gravityArgs
      )
    } else if (args.showID) {
      response = await partnerShowDocumentsLoader!(
        { showId: args.showID, partnerId: partnerID },
        gravityArgs
      )
    } else {
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
