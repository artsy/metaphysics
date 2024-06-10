import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLBoolean,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import Show from "../show"

interface UpdatePartnerShowMutationInputProps {
  partnerId: string
  showId: string
  featured: boolean
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerShowSuccess",
  isTypeOf: (data) => data._id,
  fields: () => ({
    show: {
      type: Show.type,
      resolve: (show) => show,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerShowFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdatePartnerShowResponseOrError",
  types: [SuccessType, FailureType],
})

export const updatePartnerShowMutation = mutationWithClientMutationId<
  UpdatePartnerShowMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdatePartnerShowMutation",
  description: "Updates a partner artist.",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the partner to update.",
    },
    showId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the artist to update.",
    },
    featured: {
      type: GraphQLBoolean,
      description: "Is",
    },
  },
  outputFields: {
    showOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the updated partner. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, showId, featured },
    { updatePartnerShowLoader }
  ) => {
    if (!updatePartnerShowLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    try {
      const response = await updatePartnerShowLoader(
        { partnerId, showId },
        {
          featured,
        }
      )

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
