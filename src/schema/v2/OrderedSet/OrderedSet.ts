import cached from "../fields/cached"
import { OrderedSetItemType, OrderedSetItemConnection } from "../item"
import { IDFields } from "../object_identification"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLFieldConfig,
  GraphQLBoolean,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "../artwork"
import { connectionFromArraySlice } from "graphql-relay"
import { getPagingParameters, pageable } from "relay-cursor-paging"
import { Gravity } from "types/runtime"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionWithCursorInfo } from "../fields/pagination"
import { Array } from "runtypes"
import { markdown } from "../fields/markdown"
import { OrderedSetLayoutsEnum } from "./OrderedSetLayoutsEnum"

export const OrderedSetType = new GraphQLObjectType<
  Gravity.OrderedSet & { cached: number },
  ResolverContext
>({
  name: "OrderedSet",
  fields: () => ({
    ...IDFields,
    cached,
    description: markdown(),
    key: {
      type: GraphQLString,
    },
    name: {
      type: GraphQLString,
    },
    layout: {
      type: new GraphQLNonNull(OrderedSetLayoutsEnum),
    },
    itemType: {
      type: GraphQLString,
      resolve: ({ item_type }) => item_type,
    },
    ownerType: {
      type: GraphQLString,
      resolve: ({ owner_type }) => owner_type,
    },
    published: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    items: {
      type: new GraphQLList(OrderedSetItemType),
      resolve: ({ id, item_type }, _options, { setItemsLoader }) => {
        return setItemsLoader(id).then(({ body: items }) => {
          return items.map((item) => {
            return { ...item, item_type }
          })
        })
      },
    },
    orderedItemsConnection: {
      type: new GraphQLNonNull(OrderedSetItemConnection.connectionType),
      args: pageable(),
      resolve: async ({ id, item_type }, args, { setItemsLoader }) => {
        const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

        const { body, headers } = await setItemsLoader(id, {
          total_count: true,
          page,
          size,
        })

        const validated = Array(Gravity.OrderedItem).check(body)
        const discriminated = validated.map((item) => ({ ...item, item_type }))
        const totalCount = parseInt(headers["x-total-count"] || "0", 10)

        return {
          totalCount,
          ...connectionFromArraySlice(discriminated, args, {
            arrayLength: totalCount,
            sliceStart: offset,
          }),
        }
      },
    },
    itemsConnection: {
      deprecationReason: "Utilize `orderedItemsConnection` for union type",
      type: artworkConnection.connectionType,
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
  }),
})

export const OrderedSet: GraphQLFieldConfig<void, ResolverContext> = {
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

export const OrderedSetConnection = connectionWithCursorInfo({
  nodeType: OrderedSetType,
})

export default OrderedSet
