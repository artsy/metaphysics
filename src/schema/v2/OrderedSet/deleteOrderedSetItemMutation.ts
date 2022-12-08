import { GraphQLString, GraphQLUnionType, GraphQLObjectType } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { OrderedSetItemType } from "../item"

interface Input {
  id: string
  itemId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteOrderedSetItemSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
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
    orderedSetItemOrError: {
      type: ResponseOrErrorType,
      description: "On success: the ordered set item deleted.",
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

      const { item_type } = await setLoader(id)

      return { item_type, ...res }
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
