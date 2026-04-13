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
import { PartnerListType } from "schema/v2/partnerList"

interface RemoveArtworkFromPartnerListMutationInputProps {
  listId: string
  artworkId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "RemoveArtworkFromPartnerListSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerList: {
      type: PartnerListType,
      resolve: (partnerList) => partnerList,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "RemoveArtworkFromPartnerListFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RemoveArtworkFromPartnerListResponseOrError",
  types: [SuccessType, FailureType],
})

export const removeArtworkFromPartnerListMutation = mutationWithClientMutationId<
  RemoveArtworkFromPartnerListMutationInputProps,
  any,
  ResolverContext
>({
  name: "RemoveArtworkFromPartnerListMutation",
  description: "Removes an artwork from a partner list.",
  inputFields: {
    listId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner list.",
    },
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artwork to remove.",
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
    { listId, artworkId },
    { removeArtworkFromPartnerListLoader, partnerListLoader }
  ) => {
    if (!removeArtworkFromPartnerListLoader || !partnerListLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      await removeArtworkFromPartnerListLoader({ listId, artworkId })
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
