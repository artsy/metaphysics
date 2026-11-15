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
import { PartnerListPublicationType } from "schema/v2/partnerListPublication"

interface Input {
  partnerListID: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerListPublicationCoverImageSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerListPublication: {
      type: PartnerListPublicationType,
      resolve: (publication) => publication,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerListPublicationCoverImageFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeletePartnerListPublicationCoverImageResponseOrError",
  types: [SuccessType, FailureType],
})

export const deletePartnerListPublicationCoverImageMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "DeletePartnerListPublicationCoverImageMutation",
  description: "Removes a private viewing room's cover image.",
  inputFields: {
    partnerListID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the private viewing room's partner list.",
    },
  },
  outputFields: {
    partnerListPublicationOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the partner list publication. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerListID },
    { deletePartnerListPublicationCoverImageLoader }
  ) => {
    if (!deletePartnerListPublicationCoverImageLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      return await deletePartnerListPublicationCoverImageLoader(partnerListID)
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
