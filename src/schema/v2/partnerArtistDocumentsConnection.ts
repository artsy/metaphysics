import config from "config"
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

export const PartnerArtistDocumentType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "PartnerArtistDocument",
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

export const PartnerArtistDocumentsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: connectionWithCursorInfo({
    nodeType: PartnerArtistDocumentType,
  }).connectionType,
  description:
    "Retrieve all partner artist documents for a given partner and artist",
  args: pageable({
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Partner",
    },
    artistID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the Artist",
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
      { artistId: args.artistID, partnerId: args.partnerID },
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
