// @flow
import type { GraphQLFieldConfig } from "graphql"
import { pageable } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"
import _ from "lodash"
import gravity from "../lib/loaders/gravity"
import cached from "./fields/cached"
import { artworkConnection } from "./artwork"
import filterArtworks, { filterArtworksArgs } from "./filter_artworks"
import { queriedForFieldsOtherThanBlacklisted, parseRelayOptions } from "../lib/helpers"
import { GravityIDFields, NodeInterface } from "./object_identification"
import { GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLBoolean } from "graphql"

const CollectionType = new GraphQLObjectType({
  name: "Collection",
  interfaces: [NodeInterface],
  isTypeOf: obj => _.has(obj, "name") && _.has(obj, "private") && _.has(obj, "default"),
  fields: {
    ...GravityIDFields,
    cached,
    artworks_connection: {
      type: artworkConnection,
      args: pageable({}),
      resolve: ({ id }, options, request, { rootValue: { accessToken, userID } }) => {
        const gravityOptions = parseRelayOptions(options)
        gravityOptions.user_id = userID
        gravityOptions.total_count = true

        // TODO: what do to with this?
        delete gravityOptions.page

        return gravity
          .with(accessToken, { headers: true })(`collections/artworks`, gravityOptions)
          .then(({ body, headers }) => {
            return connectionFromArraySlice(body, options, {
              arrayLength: headers["x-total-count"],
              sliceStart: gravityOptions.offset,
            })
          })
      },
    },
    description: {
      type: GraphQLString,
    },
    default: {
      type: GraphQLBoolean,
    },
    name: {
      type: GraphQLString,
    },
    private: {
      type: GraphQLBoolean,
    },
    slug: {
      type: GraphQLString,
    },
  },
})

const Collection: GraphQLFieldConfig<CollectionType, *> = {
  type: CollectionType,
  args: {
    id: {
      description: "The slug or ID of the Collection",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (root, { id }, request, { fieldNodes }) => {
    // If you are just making an artworks call ( e.g. if paginating )
    // do not make a Gravity call for the gene data.
    const blacklistedFields = ["artworks_connection", "id", "__id"]
    if (queriedForFieldsOtherThanBlacklisted(fieldNodes, blacklistedFields)) {
      return gravity(`collection/${id}`)
    }

    // These are here so that the type system's `isTypeOf`
    // resolves correctly when we're skipping gravity data
    return { id, name: null, private: null, default: null }
  },
}

export default Collection
