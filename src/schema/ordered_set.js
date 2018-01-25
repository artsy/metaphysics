import cached from "./fields/cached"
import ItemType from "./item"
import { IDFields } from "./object_identification"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
} from "graphql"

const OrderedSetType = new GraphQLObjectType({
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
      resolve: (
        { id, item_type },
        options,
        request,
        { rootValue: { setItemsLoader } }
      ) => {
        return setItemsLoader(id).then(items => {
          return items.map(item => {
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

const OrderedSet = {
  type: OrderedSetType,
  description: "An OrderedSet",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the OrderedSet",
    },
  },
  resolve: (root, { id }, request, { rootValue: { setLoader } }) =>
    setLoader(id),
}

export default OrderedSet
