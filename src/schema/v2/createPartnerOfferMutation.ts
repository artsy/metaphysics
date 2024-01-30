import {
  GraphQLInt,
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
import { PartnerOfferType } from "./partnerOffer"
import { PartnerType } from "schema/v2/partner/partner"

interface Input {
  artwork_id: string
  discount_percentage: number
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "createPartnerOfferSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerOffer: {
      type: PartnerOfferType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "createPartnerOfferFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "createPartnerOfferResponseOrError",
  types: [SuccessType, FailureType],
})

export const createPartnerOfferMutation = mutationWithClientMutationId<
  Input,
  any | null,
  ResolverContext
>({
  name: "createPartnerOfferMutation",
  description: "Create a partner offer for the users",
  inputFields: {
    artwork_id: { type: new GraphQLNonNull(GraphQLString) },
    discount_percentage: { type: GraphQLInt },
  },
  outputFields: {
    partner: {
      type: PartnerType,
      resolve: (result) => result.partner || null,
    },
    partnerOfferOrError: {
      type: ResponseOrErrorType,
      description: "On success: the partner offer created.",
      resolve: (result) => result.partnerOffer || result,
    },
  },
  mutateAndGetPayload: async (
    args,
    { createPartnerOfferLoader, partnerAllLoader }
  ) => {
    if (!createPartnerOfferLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const partnerOffer = await createPartnerOfferLoader?.({
        artwork_id: args.artwork_id,
        discount_percentage: args.discount_percentage,
      })

      const partner = await partnerAllLoader?.(partnerOffer._id)

      return { partnerOffer, partner }
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
