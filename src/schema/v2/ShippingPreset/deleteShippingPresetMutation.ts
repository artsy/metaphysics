import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import ShippingPreset from "../shippingPreset"

interface DeleteShippingPresetMutationInputProps {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteShippingPresetSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    shippingPreset: {
      type: ShippingPreset.type,
      resolve: (shippingPreset) => shippingPreset,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteShippingPresetFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteShippingPresetResponseOrError",
  types: [SuccessType, FailureType],
})

export const deleteShippingPresetMutation = mutationWithClientMutationId<
  DeleteShippingPresetMutationInputProps,
  any,
  ResolverContext
>({
  name: "DeleteShippingPresetMutation",
  description: "Deletes a shipping preset for a partner.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the shipping preset to delete.",
    },
  },
  outputFields: {
    shippingPresetOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the deleted shipping preset. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteShippingPresetLoader }) => {
    if (!deleteShippingPresetLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await deleteShippingPresetLoader(id)

      return response
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
