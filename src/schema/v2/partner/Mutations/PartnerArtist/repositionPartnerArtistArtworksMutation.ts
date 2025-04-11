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
import Partner from "../../partner"

interface RepositionPartnerArtistArtworksMutationInputProps {
  artistId: string
  partnerId: string
  artworkIds: string[]
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "RepositionPartnerArtistArtworksSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partner: {
      type: Partner.type,
      resolve: ({ partnerId }, _args, { partnerLoader }) => {
        return partnerLoader(partnerId)
      },
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "RepositionPartnerArtistArtworksFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RepositionPartnerArtistArtworksResponseOrError",
  types: [SuccessType, FailureType],
})

export const repositionPartnerArtistArtworksMutation = mutationWithClientMutationId<
  RepositionPartnerArtistArtworksMutationInputProps,
  any,
  ResolverContext
>({
  name: "RepositionPartnerArtistArtworksMutation",
  description:
    "Reposition artworks for a partner artist, determining their display order.",
  inputFields: {
    artistId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artist.",
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
    partnerOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artistId, partnerId, artworkIds },
    { repositionPartnerArtistArtworksLoader }
  ) => {
    if (!repositionPartnerArtistArtworksLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const identifiers = {
      artistId,
      partnerId,
    }

    const data = {
      artwork_ids: artworkIds,
    }

    try {
      const response = await repositionPartnerArtistArtworksLoader(
        identifiers,
        data
      )

      return { ...response, partnerId }
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
