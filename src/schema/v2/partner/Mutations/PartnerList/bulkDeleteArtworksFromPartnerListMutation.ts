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

interface BulkDeleteArtworksFromPartnerListMutationInputProps {
  listId: string
  artworkIds: string[]
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "BulkDeleteArtworksFromPartnerListSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerList: {
      type: PartnerListType,
      resolve: (partnerList) => partnerList,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "BulkDeleteArtworksFromPartnerListFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "BulkDeleteArtworksFromPartnerListResponseOrError",
  types: [SuccessType, FailureType],
})

export const bulkDeleteArtworksFromPartnerListMutation =
  mutationWithClientMutationId<
    BulkDeleteArtworksFromPartnerListMutationInputProps,
    any,
    ResolverContext
  >({
    name: "BulkDeleteArtworksFromPartnerListMutation",
    description: "Bulk removes artworks from a partner list.",
    inputFields: {
      listId: {
        type: new GraphQLNonNull(GraphQLString),
        description: "The ID of the partner list.",
      },
      artworkIds: {
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(GraphQLString))
        ),
        description: "The IDs of the artworks to remove.",
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
      { bulkDeleteArtworksFromPartnerListLoader, partnerListLoader }
    ) => {
      if (!bulkDeleteArtworksFromPartnerListLoader || !partnerListLoader) {
        return new Error("You need to be signed in to perform this action")
      }

      try {
        await bulkDeleteArtworksFromPartnerListLoader(listId, {
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
