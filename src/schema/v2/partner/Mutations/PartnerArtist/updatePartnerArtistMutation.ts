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

export const updatePartnerArtistMutation = mutationWithClientMutationId({
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
    biography: {
      type: GraphQLString,
      description: "The partner-provided biography of the artist.",
    },
    useDefaultBiography: {
      type: GraphQLBoolean,
      description:
        "Whether to use the default biography for the artist instead of the partner-provided one.",
    },
    displayOnPartnerProfile: {
      type: GraphQLBoolean,
      description: "Whether to display the artist on the partner profile page.",
    },
    hideInPresentationMode: {
      type: GraphQLBoolean,
      description:
        "Whether to hide the artist in presentation mode (Folio) for the partner.",
    },
    representedBy: {
      type: GraphQLBoolean,
      description: "Whether the artist is represented by the partner.",
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
    {
      id,
      remoteImageUrl,
      biography,
      useDefaultBiography,
      displayOnPartnerProfile,
      hideInPresentationMode,
      representedBy,
    },
    { updatePartnerArtistLoader }
  ) => {
    if (!updatePartnerArtistLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const gravityArgs: {
      remote_image_url?: string
      biography?: string
      use_default_biography?: boolean
      display_on_partner_profile?: boolean
      hide_in_presentation_mode?: boolean
      represented_by?: boolean
    } = {
      remote_image_url: remoteImageUrl,
      biography,
      use_default_biography: useDefaultBiography,
      display_on_partner_profile: displayOnPartnerProfile,
      hide_in_presentation_mode: hideInPresentationMode,
      represented_by: representedBy,
    }

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
