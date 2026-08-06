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

interface UnpublishPartnerListPublicationMutationInputProps {
  partnerListID: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UnpublishPartnerListPublicationSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerListPublication: {
      type: PartnerListPublicationType,
      resolve: (publication) => publication,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UnpublishPartnerListPublicationFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UnpublishPartnerListPublicationResponseOrError",
  types: [SuccessType, FailureType],
})

export const unpublishPartnerListPublicationMutation = mutationWithClientMutationId<
  UnpublishPartnerListPublicationMutationInputProps,
  any,
  ResolverContext
>({
  name: "UnpublishPartnerListPublicationMutation",
  description:
    "Unpublishes a partner list's private viewing room. Does not delete the publication.",
  inputFields: {
    partnerListID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner list to unpublish.",
    },
  },
  outputFields: {
    partnerListPublicationOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the unpublished partner list publication. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerListID },
    { unpublishPartnerListPublicationLoader }
  ) => {
    if (!unpublishPartnerListPublicationLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      return await unpublishPartnerListPublicationLoader(partnerListID)
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
