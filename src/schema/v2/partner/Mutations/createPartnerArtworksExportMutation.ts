import {
  GraphQLList,
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
  artworkIds?: string[]
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
    artworkIds: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      description:
        "Optional list of artwork IDs to export. Exports all artworks if omitted.",
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
    { partnerId, artworkIds },
    { createPartnerArtworksExportLoader }
  ) => {
    if (!createPartnerArtworksExportLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await createPartnerArtworksExportLoader(partnerId, {
        ...(artworkIds && { artwork_ids: artworkIds }),
      })
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
