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
import { ShowType } from "../show"

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "RemoveArtworkFromPartnerShowSuccess",
  isTypeOf: (data) => data._id,
  fields: () => ({
    show: {
      type: ShowType,
      resolve: (response) => response,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "RemoveArtworkFromPartnerShowFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RemoveArtworkFromPartnerShowResponseOrError",
  types: [SuccessType, FailureType],
})

export const removeArtworkFromPartnerShowMutation = mutationWithClientMutationId<
  any,
  any,
  ResolverContext
>({
  name: "RemoveArtworkFromPartnerShowMutation",
  description: "Removes an artwork from a partner show.",
  inputFields: {
    showId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the show.",
    },
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner.",
    },
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artwork to add to the show.",
    },
  },
  outputFields: {
    showOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the show that the artwork was removed from. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { showId, artworkId, partnerId },
    { removeArtworkFromPartnerShowLoader }
  ) => {
    if (!removeArtworkFromPartnerShowLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const identifiers = { showId, artworkId, partnerId }

    try {
      const response = await removeArtworkFromPartnerShowLoader(identifiers)

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
