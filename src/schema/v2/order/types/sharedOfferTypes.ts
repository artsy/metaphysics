import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { OfferType } from "./OfferType"

const ExchangeErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "OfferExchangeError",
  fields: {
    message: { type: new GraphQLNonNull(GraphQLString) },
    code: { type: new GraphQLNonNull(GraphQLString) },
  },
})

const ErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "OfferMutationError",
  fields: () => ({
    mutationError: {
      type: new GraphQLNonNull(ExchangeErrorType),
      resolve: (err) => (typeof err.message === "object" ? err.message : err),
    },
  }),
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "OfferMutationSuccess",
  fields: () => ({
    offer: {
      type: new GraphQLNonNull(OfferType),
      resolve: (response) => {
        return response
      },
    },
  }),
})

export const OFFER_MUTATION_FLAGS = {
  SUCCESS: "ExchangeOfferSuccessType",
  ERROR: "ExchangeOfferErrorType",
} as const

export const OfferMutationResponseType = new GraphQLUnionType({
  name: "OfferMutationResponse",
  types: [SuccessType, ErrorType],
  resolveType: (data) => {
    switch (data._type) {
      case OFFER_MUTATION_FLAGS.ERROR:
        return ErrorType
      case OFFER_MUTATION_FLAGS.SUCCESS:
      default:
        return SuccessType
    }
  },
})
