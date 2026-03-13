import {
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

interface CreatePartnerArtworksExportMutationInputProps {
  partnerId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerArtworksExportSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    exportId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the enqueued export job.",
      resolve: ({ id }) => id,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerArtworksExportFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreatePartnerArtworksExportResponseOrError",
  types: [SuccessType, FailureType],
})

export const createPartnerArtworksExportMutation = mutationWithClientMutationId<
  CreatePartnerArtworksExportMutationInputProps,
  any,
  ResolverContext
>({
  name: "CreatePartnerArtworksExportMutation",
  description: "Enqueue a CSV export of all artworks for a partner.",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner.",
    },
  },
  outputFields: {
    partnerArtworksExportOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the export job ID. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId },
    { createPartnerArtworksExportLoader }
  ) => {
    if (!createPartnerArtworksExportLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await createPartnerArtworksExportLoader(partnerId)
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
