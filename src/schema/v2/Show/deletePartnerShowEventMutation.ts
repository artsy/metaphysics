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
import ShowEventType from "../show_event"
import { ShowType } from "../show"

interface DeletePartnerShowEventMutationInputProps {
  partnerId: string
  showId: string
  eventId: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerShowEventSuccess",
  isTypeOf: (data) => data._id,
  fields: () => ({
    showEvent: {
      type: ShowEventType,
      resolve: (showEvent) => showEvent,
    },
    show: {
      type: ShowType,
      resolve: ({ partner_show }) => partner_show,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "DeletePartnerShowEventFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "DeletePartnerShowEventResponseOrError",
  types: [SuccessType, FailureType],
})

export const deletePartnerShowEventMutation = mutationWithClientMutationId<
  DeletePartnerShowEventMutationInputProps,
  any,
  ResolverContext
>({
  name: "DeletePartnerShowEventMutation",
  description: "Deletes a partner show event.",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner.",
    },
    showId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the show.",
    },
    eventId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the event to delete.",
    },
  },
  outputFields: {
    showEventOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the deleted show event. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, showId, eventId },
    { deletePartnerShowEventLoader }
  ) => {
    if (!deletePartnerShowEventLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const identifiers = {
      partnerID: partnerId,
      showID: showId,
      eventID: eventId,
    }

    try {
      const response = await deletePartnerShowEventLoader(identifiers)

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
