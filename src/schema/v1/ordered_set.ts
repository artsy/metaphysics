import cached from "./fields/cached"
import ItemType from "./item"
import { IDFields } from "./object_identification"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

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
    item_type: {
      type: GraphQLString,
    },
    items: {
      type: new GraphQLList(ItemType),
      resolve: ({ id, item_type }, _options, { setItemsLoader }) => {
        return setItemsLoader(id).then(({ body: items }) => {
          return items.map((item) => {
            item.item_type = item_type // eslint-disable-line no-param-reassign
            return item
          })
        })
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
