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
import momentTimezone from "moment-timezone"
import { ShowType } from "../show"

interface UpdatePartnerShowEventMutationInputProps {
  partnerId: string
  showId: string
  eventId: string
  startAt?: string
  endAt?: string
  eventType?: string
  description?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdatePartnerShowEventSuccess",
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
  name: "UpdatePartnerShowEventFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdatePartnerShowEventResponseOrError",
  types: [SuccessType, FailureType],
})

export const updatePartnerShowEventMutation = mutationWithClientMutationId<
  UpdatePartnerShowEventMutationInputProps,
  any,
  ResolverContext
>({
  name: "UpdatePartnerShowEventMutation",
  description: "Updates a partner show event.",
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
      description: "The ID of the event to update.",
    },
    startAt: {
      type: GraphQLString,
      description: "The start time of the event.",
    },
    endAt: {
      type: GraphQLString,
      description: "The end time of the event.",
    },
    eventType: {
      type: GraphQLString,
      description: "The type of event.",
    },
    description: {
      type: GraphQLString,
      description: "A description of the event.",
    },
    timeZone: {
      type: GraphQLString,
      description: "The time zone of the event.",
    },
  },
  outputFields: {
    showEventOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the updated show event. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, showId, eventId, ...args },
    { updatePartnerShowEventLoader }
  ) => {
    if (!updatePartnerShowEventLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const showIdentifiers = { partnerId, showId, eventId }

    const gravityArgs: {
      start_at?: number
      end_at?: number
      event_type?: string
      description?: string
      time_zone?: string
    } = {}

    if (args.startAt) {
      gravityArgs.start_at = momentTimezone
        .tz(args.startAt, args.timeZone)
        .unix()
    }

    if (args.endAt) {
      gravityArgs.end_at = momentTimezone.tz(args.endAt, args.timeZone).unix()
    }

    if (args.eventType) {
      gravityArgs.event_type = args.eventType
    }

    if (args.description !== undefined) {
      gravityArgs.description = args.description
    }

    if (args.timeZone) {
      gravityArgs.time_zone = args.timeZone
    }

    try {
      const response = await updatePartnerShowEventLoader(
        showIdentifiers,
        gravityArgs
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
