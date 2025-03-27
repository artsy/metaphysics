import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLList,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ShowType } from "../show"

interface RepositionArtworksInPartnerShowMutationInputProps {
  showId: string
  partnerId: string
  artworkIds: string[]
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "RepositionArtworksInPartnerShowSuccess",
  isTypeOf: ({ _id }) => !!_id,
  fields: () => ({
    show: {
      type: ShowType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "RepositionArtworksInPartnerShowFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RepositionArtworksInPartnerShowResponseOrError",
  types: [SuccessType, FailureType],
})

export const repositionArtworksInPartnerShowMutation = mutationWithClientMutationId<
  RepositionArtworksInPartnerShowMutationInputProps,
  any,
  ResolverContext
>({
  name: "RepositionArtworksInPartnerShowMutation",
  description:
    "Reposition artworks in a partner show, determining their display order.",
  inputFields: {
    showId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the show.",
    },
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner.",
    },
    artworkIds: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      description:
        "An ordered array of artwork IDs representing the new display order.",
    },
  },
  outputFields: {
    showOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the show with repositioned artworks. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { showId, partnerId, artworkIds },
    { repositionArtworksInPartnerShowLoader }
  ) => {
    if (!repositionArtworksInPartnerShowLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const identifiers = {
      showId,
      partnerId,
    }

    const data = {
      artwork_ids: artworkIds,
    }

    try {
      const response = await repositionArtworksInPartnerShowLoader(
        identifiers,
        data
      )

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
