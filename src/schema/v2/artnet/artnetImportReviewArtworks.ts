import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { ResolverContext } from "types/graphql"
import { ArtworkType } from "../artwork"
import { ArtworkDuplicatePairType } from "../artworkDuplicatePair/artworkDuplicatePairType"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "../fields/pagination"
import { InternalIDFields } from "../object_identification"

export const ArtnetImportReviewStateEnum = new GraphQLEnumType({
  name: "ArtnetImportReviewState",
  values: {
    OPEN: {
      value: "open",
      description:
        "At least one possible duplicate is still waiting for review.",
    },
    REVIEWED: {
      value: "reviewed",
      description: "Every possible duplicate has been merged or dismissed.",
    },
  },
})

const ArtnetRecordType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtnetImportArtnetRecord",
  description:
    "The work as Artnet sent it, kept on the import even after the imported copy is merged away.",
  fields: {
    title: { type: GraphQLString },
    date: {
      type: GraphQLString,
      resolve: ({ year, to_year }) => {
        if (!year) return null
        return to_year && to_year !== year ? `${year}-${to_year}` : `${year}`
      },
    },
    artistName: {
      type: GraphQLString,
      resolve: ({ artist_name }) => artist_name,
    },
    medium: { type: GraphQLString },
    height: { type: GraphQLString },
    width: { type: GraphQLString },
    depth: { type: GraphQLString },
    diameter: { type: GraphQLString },
    metric: { type: GraphQLString },
    imageURL: {
      type: GraphQLString,
      resolve: ({ image_url }) => image_url,
    },
  },
})

export const ArtnetImportReviewArtworkType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArtnetImportReviewArtwork",
  description:
    "An Artnet work from an import that was sent to review, with its possible duplicates.",
  fields: () => ({
    ...InternalIDFields,
    artnetArtworkID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ artnet_artwork_id }) => artnet_artwork_id,
    },
    artnetRecord: {
      type: new GraphQLNonNull(ArtnetRecordType),
      resolve: ({ artnet_record }) => artnet_record,
    },
    importedArtwork: {
      type: ArtworkType,
      description:
        "The artwork the import created. Null once it has been merged into an existing artwork.",
      resolve: async ({ artwork_id }, _args, { artworkLoader }) => {
        if (!artwork_id) return null
        try {
          return await artworkLoader(artwork_id)
        } catch (error) {
          if (error.statusCode === 404) return null
          throw error
        }
      },
    },
    duplicatePairs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ArtworkDuplicatePairType))
      ),
      resolve: ({ duplicate_pairs }) => duplicate_pairs,
    },
  }),
})

const ArtnetImportReviewArtworkConnection = connectionWithCursorInfo({
  nodeType: ArtnetImportReviewArtworkType,
}).connectionType

export const ArtnetImportReviewArtworksConnection: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: ArtnetImportReviewArtworkConnection,
  description: "The import's Artnet works that were sent to review",
  args: pageable({
    reviewState: {
      type: new GraphQLNonNull(ArtnetImportReviewStateEnum),
    },
  }),
  resolve: async ({ id }, args, { artnetImportReviewArtworksLoader }) => {
    if (!artnetImportReviewArtworksLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { body, headers } = await artnetImportReviewArtworksLoader(id, {
      review_state: args.reviewState,
      page,
      size,
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
