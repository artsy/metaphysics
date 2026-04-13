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

interface RepositionPartnerListArtworksMutationInputProps {
  listId: string
  artworkIds: string[]
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "RepositionPartnerListArtworksSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerList: {
      type: PartnerListType,
      resolve: (partnerList) => partnerList,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "RepositionPartnerListArtworksFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RepositionPartnerListArtworksResponseOrError",
  types: [SuccessType, FailureType],
})

export const repositionPartnerListArtworksMutation = mutationWithClientMutationId<
  RepositionPartnerListArtworksMutationInputProps,
  any,
  ResolverContext
>({
  name: "RepositionPartnerListArtworksMutation",
  description: "Repositions all artworks in a partner list.",
  inputFields: {
    listId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner list.",
    },
    artworkIds: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      description:
        "The ordered list of artwork IDs representing the new positions.",
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
    { repositionPartnerListArtworksLoader, partnerListLoader }
  ) => {
    if (!repositionPartnerListArtworksLoader || !partnerListLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      await repositionPartnerListArtworksLoader(listId, {
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
