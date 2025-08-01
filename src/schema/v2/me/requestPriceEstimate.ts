import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { GravityMutationErrorType } from "lib/gravityErrorHandler"
import { camelCase } from "lodash"
import { ResolverContext } from "types/graphql"

const SubmittedPriceEstimateParamsType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "SubmittedPriceEstimateParams",
  fields: () => ({
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Artwork ID submitted for estimate",
    },
    requesterName: {
      type: GraphQLString,
      description: "Name of the requester",
    },
    requesterEmail: {
      type: GraphQLString,
      description: "Email of the requester",
    },
    requesterPhoneNumber: {
      type: GraphQLString,
      description: "Phone number of the requester",
    },
  }),
})

const MutationSuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "RequestPriceEstimatedMutationSuccess",
  isTypeOf: (data) => {
    return data._type !== "GravityMutationError"
  },
  fields: () => ({
    submittedPriceEstimateParams: {
      type: SubmittedPriceEstimateParamsType,
      resolve: (submittedPriceEstimateParams) => {
        const result = {}
        const keys = Object.keys(submittedPriceEstimateParams)
        keys.forEach((key) => {
          result[camelCase(key)] = submittedPriceEstimateParams[key]
        })
        return result
      },
    },
  }),
})

const MutationFailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "RequestPriceEstimatedMutationFailure",
  isTypeOf: (data) => {
    return data._type === "GravityMutationError"
  },
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
  }),
})

const RequestPriceEstimateMutationType = new GraphQLUnionType({
  name: "RequestPriceEstimateMutationType",
  types: [MutationSuccessType, MutationFailureType],
})

export const requestPriceEstimateMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "RequestPriceEstimate",
  description: "Request price estimate of an artwork",
  inputFields: {
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
    },
    requesterName: {
      type: GraphQLString,
    },
    requesterEmail: {
      type: GraphQLString,
    },
    requesterPhoneNumber: {
      type: GraphQLString,
    },
  },
  outputFields: {
    priceEstimateParamsOrError: {
      type: RequestPriceEstimateMutationType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: () => {
    throw new Error("Artwork submissions are not accepted at this time.")
  },
})
