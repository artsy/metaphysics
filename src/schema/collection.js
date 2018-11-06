// @ts-check
import { pageable } from "relay-cursor-paging"
import { connectionFromArray, connectionFromArraySlice } from "graphql-relay"
import { warn } from "lib/loggers"
import cached from "./fields/cached"
import CollectionSorts from "./sorts/collection_sorts"
import { artworkConnection } from "./artwork"
import {
  queriedForFieldsOtherThanBlacklisted,
  convertConnectionArgsToGravityArgs,
} from "lib/helpers"
import { GravityIDFields, NodeInterface } from "./object_identification"
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
} from "graphql"

// Note to developers working on collections, the staging server does not get a copy
// of all artwork saves, so you will need to add some each week in order to have data
// to work with.

export const CollectionType = new GraphQLObjectType({
  name: "Collection",
  interfaces: [NodeInterface],
  fields: {
    ...GravityIDFields,
    cached,
    artworks_connection: {
      type: artworkConnection,
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
      resolve: (
        { id },
        options,
        _request,
        { rootValue: { collectionArtworksLoader } }
      ) => {
        const gravityOptions = Object.assign(
          { total_count: true },
          convertConnectionArgsToGravityArgs(options)
        )
        // Adds a default case for the sort
        gravityOptions.sort = gravityOptions.sort || "-position"
        delete gravityOptions.page // this can't also be used with the offset in gravity
        return collectionArtworksLoader(id, gravityOptions)
          .then(({ body, headers }) => {
            return connectionFromArraySlice(body, options, {
              arrayLength: headers["x-total-count"],
              sliceStart: gravityOptions.offset,
            })
          })
          .catch(e => {
            warn("Bypassing Gravity error: ", e)
            // For some users with no favourites, Gravity produces an error of "Collection Not Found".
            // This can cause the Gravity endpoint to produce a 404, so we will intercept the error
            // and return an empty list instead.
            return connectionFromArray([], options)
          })
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
    slug: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
})

// This resolver is re-used by `me { saved_artworks }`
export const collectionResolverFactory = collection_id => {
  return (
    _root,
    options,
    _request,
    { fieldNodes, rootValue: { collectionLoader } }
  ) => {
    const id = collection_id || options.id
    const blacklistedFields = ["artworks_connection", "id", "__id"]

    if (queriedForFieldsOtherThanBlacklisted(fieldNodes, blacklistedFields)) {
      return collectionLoader(id)
    }

    // These are here so that the type system's `isTypeOf`
    // resolves correctly when we're skipping gravity data
    return { id, name: null, private: null, default: null }
  }
}

const Collection = {
  type: CollectionType,
  args: {
    id: {
      description: "The slug or ID of the Collection",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: collectionResolverFactory(),
}

export default Collection
