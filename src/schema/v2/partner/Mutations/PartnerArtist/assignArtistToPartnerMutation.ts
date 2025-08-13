import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLBoolean,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { PartnerArtistType } from "../../partner_artist"
import { ArtistType } from "../../../artist"
import { PartnerType } from "../../partner"

interface AssignArtistToPartnerMutationInputProps {
  artistID: string
  partnerID: string
  featured?: boolean
  remoteImageUrl?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "AssignArtistToPartnerSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerArtist: {
      type: PartnerArtistType,
      resolve: (result) => result,
    },
    artist: {
      type: ArtistType,
      resolve: ({ artist }) => artist,
    },
    partner: {
      type: PartnerType,
      resolve: ({ partner }) => partner,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "AssignArtistToPartnerFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "AssignArtistToPartnerResponseOrError",
  types: [SuccessType, FailureType],
})

export const assignArtistToPartnerMutation = mutationWithClientMutationId<
  AssignArtistToPartnerMutationInputProps,
  any,
  ResolverContext
>({
  name: "AssignArtistToPartnerMutation",
  description:
    "Assigns an artist to a partner, creating a PartnerArtist record.",
  inputFields: {
    artistID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artist to assign.",
    },
    partnerID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner to assign the artist to.",
    },
    featured: {
      type: GraphQLBoolean,
      description: "Whether the artist should be featured.",
    },
    remoteImageUrl: {
      type: GraphQLString,
      description: "The URL of the image to use for the partner artist.",
    },
  },
  outputFields: {
    partnerArtistOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the created partner artist. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artistID, partnerID, featured, remoteImageUrl },
    { createPartnerArtistLoader }
  ) => {
    if (!createPartnerArtistLoader) {
      throw new Error("You need to be logged in to perform this action")
    }

    const gravityArgs: {
      featured?: boolean
      remote_image_url?: string
    } = {
      featured,
      remote_image_url: remoteImageUrl,
    }

    try {
      const partnerArtist = await createPartnerArtistLoader(
        { artistID, partnerID },
        gravityArgs
      )
      return partnerArtist
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
