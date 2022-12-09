import {
  GraphQLString,
  GraphQLUnionType,
  GraphQLObjectType,
  GraphQLInt,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { OrderedSetItemType } from "../item"

interface Input {
  geminiToken: string
  id: string
  itemId: string
  position: number
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "addOrderedSetItemSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    setItem: {
      type: OrderedSetItemType,
      resolve: (orderedSetItem) => orderedSetItem,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "addOrderedSetItemFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "addOrderedSetItemResponseOrError",
  types: [SuccessType, FailureType],
})

export const addOrderedSetItemMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "addOrderedSetItemMutation",
  description: "adds an item to an ordered set.",
  inputFields: {
    geminiToken: { type: GraphQLString },
    id: { type: new GraphQLNonNull(GraphQLString) },
    itemId: { type: new GraphQLNonNull(GraphQLString) },
    position: { type: GraphQLInt },
  },
  outputFields: {
    orderedSetItemOrError: {
      type: ResponseOrErrorType,
      description: "On success: the ordered set item added.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { geminiToken, id, itemId, position },
    { addSetItemLoader, setLoader }
  ) => {
    if (!addSetItemLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      const res = await addSetItemLoader(id, {
        gemini_token: geminiToken,
        item_id: itemId,
        position,
      })

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
