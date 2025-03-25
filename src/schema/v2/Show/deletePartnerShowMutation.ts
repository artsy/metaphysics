import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import Show from "../show"

interface DeletePartnerShowMutationInputProps {
  partnerId: string
  showId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerShowSuccess",
  isTypeOf: (data) => data._id,
  fields: () => ({
    show: {
      type: Show.type,
      resolve: (show) => show,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerShowFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeletePartnerShowResponseOrError",
  types: [SuccessType, FailureType],
})

export const deletePartnerShowMutation = mutationWithClientMutationId<
  DeletePartnerShowMutationInputProps,
  any,
  ResolverContext
>({
  name: "DeletePartnerShowMutation",
  description: "Deletes a partner show.",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the partner.",
    },
    showId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the show to delete.",
    },
  },
  outputFields: {
    showOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the deleted show. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, showId },
    { deletePartnerShowLoader }
  ) => {
    if (!deletePartnerShowLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const showIdentifiers = { partnerID: partnerId, showID: showId }

    try {
      const response = await deletePartnerShowLoader(showIdentifiers)
      return response
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
