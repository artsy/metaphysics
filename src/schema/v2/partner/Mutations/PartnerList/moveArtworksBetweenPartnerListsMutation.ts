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

interface MoveArtworksBetweenPartnerListsMutationInputProps {
  sourceListId: string
  destinationListId: string
  artworkIds: string[]
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "MoveArtworksBetweenPartnerListsSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerList: {
      type: PartnerListType,
      description: "The destination partner list after the move.",
      resolve: (partnerList) => partnerList,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "MoveArtworksBetweenPartnerListsFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "MoveArtworksBetweenPartnerListsResponseOrError",
  types: [SuccessType, FailureType],
})

export const moveArtworksBetweenPartnerListsMutation =
  mutationWithClientMutationId<
    MoveArtworksBetweenPartnerListsMutationInputProps,
    any,
    ResolverContext
  >({
    name: "MoveArtworksBetweenPartnerListsMutation",
    description: "Moves artworks from one partner list to another.",
    inputFields: {
      sourceListId: {
        type: new GraphQLNonNull(GraphQLString),
        description: "The ID of the source partner list.",
      },
      destinationListId: {
        type: new GraphQLNonNull(GraphQLString),
        description: "The ID of the destination partner list.",
      },
      artworkIds: {
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(GraphQLString))
        ),
        description: "The IDs of the artworks to move.",
      },
    },
    outputFields: {
      partnerListOrError: {
        type: ResponseOrErrorType,
        description:
          "On success: the destination partner list. On error: the error that occurred.",
        resolve: (result) => result,
      },
    },
    mutateAndGetPayload: async (
      { sourceListId, destinationListId, artworkIds },
      { moveArtworksBetweenPartnerListsLoader, partnerListLoader }
    ) => {
      if (!moveArtworksBetweenPartnerListsLoader || !partnerListLoader) {
        return new Error("You need to be signed in to perform this action")
      }

      try {
        await moveArtworksBetweenPartnerListsLoader(sourceListId, {
          destination_partner_list_id: destinationListId,
          artwork_ids: artworkIds,
        })
        return await partnerListLoader(destinationListId)
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
