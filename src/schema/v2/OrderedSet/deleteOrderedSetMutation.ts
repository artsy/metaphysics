import { GraphQLString, GraphQLUnionType, GraphQLObjectType } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GraphQLNonNull } from "graphql"
import { ResolverContext } from "types/graphql"
import { OrderedSetType } from "./index"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

interface Input {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteOrderedSetSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    set: {
      type: OrderedSetType,
      resolve: (orderedSet) => orderedSet,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "deleteOrderedSetFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "deleteOrderedSetResponseOrError",
  types: [SuccessType, FailureType],
})

export const deleteOrderedSetMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "deleteOrderedSetMutation",
  description: "deletes an ordered set.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    orderedSetOrError: {
      type: ResponseOrErrorType,
      description: "On success: the deleted ordered set.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteSetLoader }) => {
    if (!deleteSetLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    try {
      return await deleteSetLoader(id)
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
