import { GraphQLObjectType, GraphQLUnionType } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  GravityMutationErrorType,
  formatGravityError,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { PurchaseType } from "../purchase"
import { PurchaseInputFields } from "./types"
import { convertToGravityArgs } from "./helpers"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePurchaseSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    purchase: {
      type: PurchaseType,
      resolve: (data) => data,
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePurchaseFailure",
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
  name: "CreatePurchaseResponseOrError",
  types: [SuccessType, ErrorType],
})

export const createPurchaseMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "createPurchase",
  description: "Create a purchase",
  inputFields: {
    ...PurchaseInputFields,
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ ...args }, { createPurchaseLoader }) => {
    if (!createPurchaseLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const gravityArgs = convertToGravityArgs(args)
      const response = await createPurchaseLoader(gravityArgs)

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
