import { GraphQLString, GraphQLUnionType, GraphQLObjectType } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { OrderedSetItemType } from "../item"
import { OrderedSetType } from "./OrderedSet"

interface Input {
  id: string
  itemId: string
  setId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteOrderedSetItemSuccess",
  isTypeOf: (data) => data.id || data._id,
  fields: () => ({
    set: {
      type: OrderedSetType,
    },
    setItem: {
      type: OrderedSetItemType,
      resolve: (orderedSetItem) => orderedSetItem,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteOrderedSetItemFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "deleteOrderedSetItemResponseOrError",
  types: [SuccessType, FailureType],
})

export const deleteOrderedSetItemMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "deleteOrderedSetItemMutation",
  description: "deletes an item to an ordered set.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    itemId: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    deleteOrderedSetItemResponseOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the updated parent set or the set item deleted.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, itemId },
    { deleteSetItemLoader, setLoader }
  ) => {
    if (!deleteSetItemLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      const res = await deleteSetItemLoader({ id, itemId })

      const set = await setLoader(id)

      return { item_type: set.item_type, set, ...res }
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
