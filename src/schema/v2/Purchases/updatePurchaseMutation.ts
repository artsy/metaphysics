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
import { PurchaseInputFields } from "./types"
import { convertToGravityArgs } from "./helpers"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePurchaseSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    purchase: {
      type: PurchaseType,
      resolve: (data) => data,
    },
  }),
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePurchaseFailure",
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
  name: "UpdatePurchaseResponseOrError",
  types: [SuccessType, ErrorType],
})

export const updatePurchaseMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "updatePurchase",
  description: "Update a purchase",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    ...PurchaseInputFields,
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id, ...args }, { updatePurchaseLoader }) => {
    if (!updatePurchaseLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const gravityArgs = convertToGravityArgs(args)
      const response = await updatePurchaseLoader(id, gravityArgs)

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
