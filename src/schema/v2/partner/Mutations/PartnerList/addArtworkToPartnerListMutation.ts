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

interface AddArtworkToPartnerListMutationInputProps {
  listId: string
  artworkId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "AddArtworkToPartnerListSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerList: {
      type: PartnerListType,
      resolve: (partnerList) => partnerList,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "AddArtworkToPartnerListFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "AddArtworkToPartnerListResponseOrError",
  types: [SuccessType, FailureType],
})

export const addArtworkToPartnerListMutation = mutationWithClientMutationId<
  AddArtworkToPartnerListMutationInputProps,
  any,
  ResolverContext
>({
  name: "AddArtworkToPartnerListMutation",
  description: "Adds an artwork to a partner list.",
  inputFields: {
    listId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner list.",
    },
    artworkId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the artwork to add.",
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
    { addArtworkToPartnerListLoader, partnerListLoader }
  ) => {
    if (!addArtworkToPartnerListLoader || !partnerListLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      await addArtworkToPartnerListLoader({ listId, artworkId })
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
