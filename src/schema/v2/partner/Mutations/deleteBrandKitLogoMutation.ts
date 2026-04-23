import {
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
import { BrandKitType } from "../brandKit"

interface Input {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteBrandKitLogoSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    brandKit: {
      type: BrandKitType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeleteBrandKitLogoFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeleteBrandKitLogoResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) => {
    if (data._type === "GravityMutationError") {
      return "DeleteBrandKitLogoFailure"
    }
    return "DeleteBrandKitLogoSuccess"
  },
})

export const deleteBrandKitLogoMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "DeleteBrandKitLogo",
  description: "Remove the logo from a brand kit",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID of the brand kit",
    },
  },
  outputFields: {
    brandKitOrError: {
      type: ResponseOrErrorType,
      description: "On success: the brand kit with the logo removed",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deleteBrandKitLogoLoader }) => {
    if (!deleteBrandKitLogoLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await deleteBrandKitLogoLoader(id)
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
