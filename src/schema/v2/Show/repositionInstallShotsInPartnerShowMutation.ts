import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLList,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ShowType } from "../show"

interface RepositionInstallShotsInPartnerShowMutationInputProps {
  showId: string
  imageIds: string[]
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "RepositionInstallShotsInPartnerShowSuccess",
  isTypeOf: ({ showId }) => !!showId,
  fields: () => ({
    show: {
      type: ShowType,
      resolve: ({ showId }, _args, { showLoader }) => showLoader(showId),
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "RepositionInstallShotsInPartnerShowFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RepositionInstallShotsInPartnerShowResponseOrError",
  types: [SuccessType, FailureType],
})

export const repositionInstallShotsInPartnerShowMutation = mutationWithClientMutationId<
  RepositionInstallShotsInPartnerShowMutationInputProps,
  any,
  ResolverContext
>({
  name: "RepositionInstallShotsInPartnerShowMutation",
  description:
    "Reposition installation shots in a partner show, determining their display order.",
  inputFields: {
    showId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the show.",
    },
    imageIds: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      description:
        "An ordered array of image IDs representing the new display order.",
    },
  },
  outputFields: {
    showOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the show with repositioned installation shots. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { showId, imageIds },
    { repositionInstallShotsInPartnerShowLoader }
  ) => {
    if (!repositionInstallShotsInPartnerShowLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const identifiers = {
      showId,
    }

    const data = {
      image_ids: imageIds,
    }

    try {
      const response = await repositionInstallShotsInPartnerShowLoader(
        identifiers,
        data
      )

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
