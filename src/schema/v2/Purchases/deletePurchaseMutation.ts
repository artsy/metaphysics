import {
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { PurchaseType } from "../purchase"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePurchaseSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    purchase: {
      type: PurchaseType,
      resolve: (data) => data,
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePurchaseFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeletePurchaseResponseOrError",
  types: [SuccessType, ErrorType],
})

export const deletePurchaseMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "deletePurchase",
  description: "Deletes a purchase",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, { deletePurchaseLoader }) => {
    if (!deletePurchaseLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await deletePurchaseLoader(id)

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
