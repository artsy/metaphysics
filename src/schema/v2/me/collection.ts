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
            defaultValue: CollectionArtworkSorts.getValue("SAVED_AT_DESC")
              ?.value,
          },
          page: { type: GraphQLInt },
          forSale: { type: GraphQLBoolean },
          priceMin: { type: GraphQLInt, description: "In USD Dollars" },
          priceMax: { type: GraphQLInt, description: "In USD Dollars" },
        }),
      },
      resolve: async (parent, args, context, _info) => {
        const { collectionArtworksLoader } = context
        if (!collectionArtworksLoader) return null

        const { id, userID: injectedUserID } = parent
        const { userID: currentUserID } = context
        const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

        const gravityOptions = {
          page,
          size,
          user_id: injectedUserID ?? currentUserID, // Prefer injected user ID if provided (e.g. in the case of a public collection)
          private: true,
          sort: args.sort,
          total_count: true,
          for_sale: args.forSale,
          price_min_major_usd: args.priceMin,
          price_max_major_usd: args.priceMax,
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
      args: {
        onlyVisible: {
          type: GraphQLBoolean,
          description: "Only count visible artworks",
          defaultValue: false,
        },
      },
      resolve: (
        { artworks_count, visible_artworks_count },
        { onlyVisible }
      ) => {
        return onlyVisible ? visible_artworks_count : artworks_count
      },
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
      resolve: ({ default: isDefault, saves, name }) => {
        // Rename default collection
        if (isDefault && saves) {
          return "Saved Artworks"
        }

        return name
      },
    },
    saves: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description:
        "True if this collection represents artworks explicitly saved by the user, false otherwise.",
    },
    isSavedArtwork: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Checking whether artwork is included in collection",
      args: {
        artworkID: {
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      resolve: async (parent, args, context) => {
        const { collectionArtworksLoader } = context

        if (!collectionArtworksLoader) {
          throw new Error("You need to be signed in to perform this action")
        }

        const { headers } = await collectionArtworksLoader(parent.id, {
          artworks: [args.artworkID],
          user_id: context.userID,
          private: true,
          size: 0,
          total_count: true,
        })
        const totalCount = parseInt(headers["x-total-count"] || "0", 10)

        return totalCount > 0
      },
    },
    shareableWithPartners: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: (collection) => {
        return collection.shareable_with_partners
      },
    },
    private: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    slug: {
      type: GraphQLString,
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
