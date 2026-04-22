import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"

interface Input {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteBrandKitSuccess",
  fields: () => ({
    success: {
      type: GraphQLBoolean,
      resolve: () => true,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteBrandKitFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteBrandKitResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "DeleteBrandKitFailure"
    }
    return "DeleteBrandKitSuccess"
  },
})

export const deleteBrandKitMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "DeleteBrandKit",
  description: "Delete a partner's brand kit",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the brand kit to delete",
    },
  },
  outputFields: {
    brandKitOrError: {
      type: ResponseOrErrorType,
      description: "On success: a boolean indicating the brand kit was deleted",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteBrandKitLoader }) => {
    if (!deleteBrandKitLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await deleteBrandKitLoader(id)
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
