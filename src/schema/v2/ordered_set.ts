import cached from "./fields/cached"
import { OrderedSetItemType } from "./item"
import { IDFields } from "./object_identification"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "./artwork"
import { connectionFromArraySlice } from "graphql-relay"
import { getPagingParameters, pageable } from "relay-cursor-paging"

const OrderedSetType = new GraphQLObjectType<any, ResolverContext>({
  name: "OrderedSet",
  fields: () => ({
    ...IDFields,
    cached,
    description: {
      type: GraphQLString,
    },
    key: {
      type: GraphQLString,
    },
    itemType: {
      type: GraphQLString,
      resolve: ({ item_type }) => item_type,
    },
    items: {
      type: new GraphQLList(OrderedSetItemType),
      resolve: ({ id, item_type }, _options, { setItemsLoader }) => {
        return setItemsLoader(id).then(({ body: items }) => {
          return items.map(item => {
            item.item_type = item_type // eslint-disable-line no-param-reassign
            return item
          })
        })
      },
    },
    itemsConnection: {
      type: new GraphQLNonNull(artworkConnection.connectionType),
      description:
        "Returns a connection of the items. Only Artwork supported right now.",
      args: pageable(),
      resolve: ({ id, item_type }, options, { setItemsLoader }) => {
        // Only ArtworkConnections are supported at this time.
        if (item_type === "Artwork") {
          const { limit: size, offset } = getPagingParameters(options)
          const gravityArgs = {
            size,
            offset,
            total_count: true,
          }

          return setItemsLoader(id, gravityArgs).then(({ body, headers }) => {
            const items = body
            return connectionFromArraySlice(items, options, {
              arrayLength: parseInt(headers["x-total-count"] || "0", 10),
              sliceStart: offset,
            })
          })
        } else {
          throw new Error("Can only return a connection for sets of Artworks.")
        }
      },
    },
    name: {
      type: GraphQLString,
    },
  }),
})

const OrderedSet: GraphQLFieldConfig<void, ResolverContext> = {
  type: OrderedSetType,
  description: "An OrderedSet",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the OrderedSet",
    },
  },
  resolve: (_root, { id }, { setLoader }) => setLoader(id),
}

export default OrderedSet
