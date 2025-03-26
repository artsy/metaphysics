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

interface AddArtworkToPartnerShowMutationInputProps {
  showId: string
  artworkId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "AddArtworkToPartnerShowSuccess",
  isTypeOf: (data) => data._id,
  fields: () => ({
    show: {
      type: ShowType,
      resolve: (response) => response,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "AddArtworkToPartnerShowFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "AddArtworkToPartnerShowResponseOrError",
  types: [SuccessType, FailureType],
})

export const addArtworkToPartnerShowMutation = mutationWithClientMutationId<
  AddArtworkToPartnerShowMutationInputProps,
  any,
  ResolverContext
>({
  name: "AddArtworkToPartnerShowMutation",
  description: "Adds an artwork to a partner show.",
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
        "On success: the show that the artwork was added to. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { showId, artworkId, partnerId },
    { addArtworkToPartnerShowLoader }
  ) => {
    if (!addArtworkToPartnerShowLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const identifiers = { showId, artworkId, partnerId }

    try {
      const response = await addArtworkToPartnerShowLoader(identifiers)

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
