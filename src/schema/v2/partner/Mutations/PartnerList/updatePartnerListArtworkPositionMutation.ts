import {
  GraphQLInt,
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

interface UpdatePartnerListArtworkPositionMutationInputProps {
  listId: string
  artworkId: string
  position: number
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerListArtworkPositionSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerList: {
      type: PartnerListType,
      resolve: (partnerList) => partnerList,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerListArtworkPositionFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdatePartnerListArtworkPositionResponseOrError",
  types: [SuccessType, FailureType],
})

export const updatePartnerListArtworkPositionMutation = mutationWithClientMutationId<
  UpdatePartnerListArtworkPositionMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdatePartnerListArtworkPositionMutation",
  description: "Updates the position of an artwork in a partner list.",
  inputFields: {
    listId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner list.",
    },
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artwork.",
    },
    position: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "The new position of the artwork.",
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
    { listId, artworkId, position },
    { updatePartnerListArtworkLoader, partnerListLoader }
  ) => {
    if (!updatePartnerListArtworkLoader || !partnerListLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      await updatePartnerListArtworkLoader({ listId, artworkId }, { position })
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
