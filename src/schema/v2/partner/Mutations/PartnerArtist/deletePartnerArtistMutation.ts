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
import Partner from "../../partner"

interface DeletePartnerArtistMutationInputProps {
  partnerId: string
  artistId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerArtistSuccess",
  isTypeOf: (data) => data.partnerId,
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
  name: "DeletePartnerArtistFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeletePartnerArtistResponseOrError",
  types: [SuccessType, FailureType],
})

export const deletePartnerArtistMutation = mutationWithClientMutationId<
  DeletePartnerArtistMutationInputProps,
  any,
  ResolverContext
>({
  name: "DeletePartnerArtistMutation",
  description: "Deletes a partner artist.",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner.",
    },
    artistId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artist to delete.",
    },
  },
  outputFields: {
    partnerArtistOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: confirmation of deletion. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, artistId },
    { deletePartnerArtistLoader }
  ) => {
    if (!deletePartnerArtistLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const identifiers = {
      partnerId,
      artistId,
    }

    try {
      await deletePartnerArtistLoader(identifiers)
      return { partnerId }
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
