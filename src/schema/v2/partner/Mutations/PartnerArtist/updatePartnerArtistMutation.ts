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
import { PartnerArtistType } from "../../partner_artist"
import Partner from "../../partner"

interface UpdatePartnerArtistMutationInputProps {
  id: string
  remoteImageUrl?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerArtistSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerArtist: {
      type: PartnerArtistType,
      resolve: (result) => result,
    },
    partner: {
      type: Partner.type,
      resolve: ({ partner }) => partner,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerArtistFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdatePartnerArtistResponseOrError",
  types: [SuccessType, FailureType],
})

export const updatePartnerArtistMutation = mutationWithClientMutationId<
  UpdatePartnerArtistMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdatePartnerArtistMutation",
  description: "Updates a partner artist.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner artist to update.",
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
        "On success: the updated partner artist. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, remoteImageUrl },
    { updatePartnerArtistLoader }
  ) => {
    if (!updatePartnerArtistLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const gravityArgs: {
      remote_image_url?: string
    } = { remote_image_url: remoteImageUrl }

    try {
      const partnerArtist = await updatePartnerArtistLoader(id, gravityArgs)
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
