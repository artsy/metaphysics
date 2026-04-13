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
import { PartnerListType } from "schema/v2/partnerList"

interface BulkAddArtworksToPartnerListMutationInputProps {
  listId: string
  artworkIds: string[]
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "BulkAddArtworksToPartnerListSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerList: {
      type: PartnerListType,
      resolve: (partnerList) => partnerList,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "BulkAddArtworksToPartnerListFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "BulkAddArtworksToPartnerListResponseOrError",
  types: [SuccessType, FailureType],
})

export const bulkAddArtworksToPartnerListMutation = mutationWithClientMutationId<
  BulkAddArtworksToPartnerListMutationInputProps,
  any,
  ResolverContext
>({
  name: "BulkAddArtworksToPartnerListMutation",
  description: "Bulk adds artworks to a partner list.",
  inputFields: {
    listId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner list.",
    },
    artworkIds: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      description: "The IDs of the artworks to add.",
    },
  },
  outputFields: {
    partnerListOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the updated partner list. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { listId, artworkIds },
    { bulkAddArtworksToPartnerListLoader, partnerListLoader }
  ) => {
    if (!bulkAddArtworksToPartnerListLoader || !partnerListLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      await bulkAddArtworksToPartnerListLoader(listId, {
        artwork_ids: artworkIds,
      })
      return await partnerListLoader(listId)
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
