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

interface DismissPartnerListSyncConfirmationMutationInputProps {
  id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DismissPartnerListSyncConfirmationSuccess",
  isTypeOf: (data) => data.id,
  fields: () => ({
    partnerList: {
      type: PartnerListType,
      resolve: (partnerList) => partnerList,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DismissPartnerListSyncConfirmationFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DismissPartnerListSyncConfirmationResponseOrError",
  types: [SuccessType, FailureType],
})

export const dismissPartnerListSyncConfirmationMutation = mutationWithClientMutationId<
  DismissPartnerListSyncConfirmationMutationInputProps,
  any,
  ResolverContext
>({
  name: "DismissPartnerListSyncConfirmationMutation",
  description:
    "Dismisses the one-time confirmation shown before pushing edits to a listed show.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner list.",
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
    { id },
    { dismissPartnerListSyncConfirmationLoader }
  ) => {
    if (!dismissPartnerListSyncConfirmationLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      return await dismissPartnerListSyncConfirmationLoader(id)
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
