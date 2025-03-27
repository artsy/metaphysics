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

interface UpdateInstallShotForPartnerShowMutationInputProps {
  showId: string
  imageId: string
  caption: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateInstallShotForPartnerShowSuccess",
  isTypeOf: ({ showId }) => !!showId,
  fields: () => ({
    show: {
      type: ShowType,
      resolve: ({ showId }, _args, { showLoader }) => showLoader(showId),
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateInstallShotForPartnerShowFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateInstallShotForPartnerShowResponseOrError",
  types: [SuccessType, FailureType],
})

export const updateInstallShotForPartnerShowMutation = mutationWithClientMutationId<
  UpdateInstallShotForPartnerShowMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdateInstallShotForPartnerShowMutation",
  description: "Updates an installation shot for a partner show.",
  inputFields: {
    showId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the show.",
    },
    imageId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the installation shot image to update.",
    },
    caption: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The updated caption for the installation shot.",
    },
  },
  outputFields: {
    showOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the show that contains the updated installation shot. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { showId, imageId, caption },
    { updateInstallShotLoader }
  ) => {
    if (!updateInstallShotLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const identifiers = {
      showId,
      imageId,
    }

    const data = {
      caption,
    }

    try {
      const response = await updateInstallShotLoader(identifiers, data)

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
