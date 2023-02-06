import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
} from "graphql"
import {
  CatchCollectionNotFoundException,
  convertConnectionArgsToGravityArgs,
} from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "../artwork"
import { paginationResolver } from "../fields/pagination"
import { InternalIDFields } from "../object_identification"
import CollectionArtworkSorts from "../sorts/collection_sorts"

export const CollectionType = new GraphQLObjectType<any, ResolverContext>({
  name: "Collection",
  description: "A collection of artworks",
  fields: () => ({
    ...InternalIDFields,
    artworksConnection: {
      type: artworkConnection.connectionType,
      args: {
        ...pageable({
          sort: {
            type: CollectionArtworkSorts,
            defaultValue: CollectionArtworkSorts.getValue("SAVED_AT_DESC")!
              .value,
          },
        }),
      },
      resolve: async (parent, args, context, _info) => {
        const { collectionArtworksLoader } = context
        if (!collectionArtworksLoader) return null

        const { id, userID } = parent
        const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

        const gravityOptions = {
          page,
          size,
          user_id: userID,
          private: true,
          sort: args.sort,
          total_count: true,
        }

        try {
          const { headers, body } = await collectionArtworksLoader(
            id,
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
        } catch (error) {
          return CatchCollectionNotFoundException(error)
        }
      },
    },
    artworksCount: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Number of artworks associated with this collection.",
      resolve: ({ artworks_count }) => artworks_count,
    },
    default: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description:
        "True if this is the default collection for this user, i.e. the default Saved Artwork collection.",
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description:
        "Name of the collection. Has a predictable value for 'standard' collections such as Saved Artwork, My Collection, etc. Can be provided by user otherwise.",
    },
    saves: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description:
        "True if this collection represents artworks explicitly saved by the user, false otherwise.",
    },
  }),
})

export const Collection: GraphQLFieldConfig<any, ResolverContext> = {
  description: "A collection belonging to the current user",
  type: CollectionType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: async (parent, args, context, _info) => {
    const { id: meID } = parent
    const { id } = args
    const { collectionLoader } = context

    if (!collectionLoader) return null

    const response = await collectionLoader(id, {
      user_id: meID,
      private: true,
    })

    return {
      ...response,
      userID: meID,
    }
  },
}
