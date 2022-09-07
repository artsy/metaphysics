import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"
import cached from "./fields/cached"
import CollectionSorts from "./sorts/collection_sorts"
import { artworkConnection } from "./artwork"
import {
  CatchCollectionNotFoundException,
  convertConnectionArgsToGravityArgs,
} from "lib/helpers"
import { NodeInterface, SlugAndInternalIDFields } from "./object_identification"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLFieldResolver,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { includesFieldsOtherThanSelectionSet } from "lib/hasFieldSelection"

// Note to developers working on collections, the staging server does not get a copy
// of all artwork saves, so you will need to add some each week in order to have data
// to work with.

// TODO: Is the root collection field really used and do we still need this?
export const CollectionType = new GraphQLObjectType<any, ResolverContext>({
  name: "Collection",
  interfaces: [NodeInterface],
  fields: {
    ...SlugAndInternalIDFields,
    cached,
    artworksConnection: {
      type: artworkConnection.connectionType,
      args: {
        ...pageable({}),
        private: {
          type: GraphQLBoolean,
          defaultValue: false,
        },
        sort: {
          type: CollectionSorts,
        },
      },
      resolve: ({ id }, options, { collectionArtworksLoader }) => {
        if (!collectionArtworksLoader) return null

        const gravityOptions = Object.assign(
          { total_count: true },
          convertConnectionArgsToGravityArgs(options)
        )
        // Adds a default case for the sort
        gravityOptions.sort = gravityOptions.sort || "-position"
        // @ts-expect-error FIXME: Make `page` an optional parameter of `gravityOptions`
        delete gravityOptions.page // this can't also be used with the offset in gravity
        return collectionArtworksLoader(id, gravityOptions)
          .then(({ body, headers }) => {
            return connectionFromArraySlice(body, options, {
              arrayLength: parseInt(headers["x-total-count"] || "0", 10),
              sliceStart: gravityOptions.offset,
            })
          })
          .catch(CatchCollectionNotFoundException)
      },
    },
    description: {
      type: new GraphQLNonNull(GraphQLString),
    },
    default: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    private: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  },
})

// This resolver is re-used by `me { saved_artworks }`
export const collectionResolverFactory = (
  collection_id
): GraphQLFieldResolver<void, ResolverContext> => {
  return (_root, options, { collectionLoader }, info) => {
    if (!collectionLoader) return null

    const id = collection_id || options.id
    const fieldsNotRequireLoader = ["artworks", "id", "internalID"]

    if (includesFieldsOtherThanSelectionSet(info, fieldsNotRequireLoader)) {
      return collectionLoader(id)
    }

    // These are here so that the type system's `isTypeOf`
    // resolves correctly when we're skipping gravity data
    return { id, name: null, private: null, default: null }
  }
}

const Collection: GraphQLFieldConfig<void, ResolverContext> = {
  type: CollectionType,
  args: {
    id: {
      description: "The slug or ID of the Collection",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  // FIXME: Expected 1 arguments, but got 0.
  // @ts-ignore
  resolve: collectionResolverFactory(),
}

export default Collection
