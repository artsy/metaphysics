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
import { ShowType } from "../show"

interface RemoveInstallShotFromPartnerShowMutationInputProps {
  showId: string
  imageId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "RemoveInstallShotFromPartnerShowSuccess",
  isTypeOf: ({ showId }) => !!showId,
  fields: () => ({
    show: {
      type: ShowType,
      resolve: ({ showId }, _args, { showLoader }) => showLoader(showId),
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "RemoveInstallShotFromPartnerShowFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RemoveInstallShotFromPartnerShowResponseOrError",
  types: [SuccessType, FailureType],
})

export const removeInstallShotFromPartnerShowMutation = mutationWithClientMutationId<
  RemoveInstallShotFromPartnerShowMutationInputProps,
  any,
  ResolverContext
>({
  name: "RemoveInstallShotFromPartnerShowMutation",
  description: "Removes an installation shot from a partner show.",
  inputFields: {
    showId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the show.",
    },
    imageId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the installation shot image to remove.",
    },
  },
  outputFields: {
    showOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the show that the installation shot was removed from. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { showId, imageId },
    { removeInstallShotFromPartnerShowLoader }
  ) => {
    if (!removeInstallShotFromPartnerShowLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const identifiers = {
      showId,
      imageId,
    }

    try {
      const response = await removeInstallShotFromPartnerShowLoader(identifiers)

      return {
        ...response,
        showId,
      }
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
