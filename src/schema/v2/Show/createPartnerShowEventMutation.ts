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

interface CreatePartnerShowEventMutationInputProps {
  partnerId: string
  showId: string
  startAt: string
  endAt: string
  eventType: string
  description?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerShowEventSuccess",
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
  name: "CreatePartnerShowEventFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreatePartnerShowEventResponseOrError",
  types: [SuccessType, FailureType],
})

export const createPartnerShowEventMutation = mutationWithClientMutationId<
  CreatePartnerShowEventMutationInputProps,
  any,
  ResolverContext
>({
  name: "CreatePartnerShowEventMutation",
  description: "Creates a partner show event.",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the partner.",
    },
    showId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the show.",
    },
    startAt: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The start time of the event.",
    },
    endAt: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The end time of the event.",
    },
    eventType: {
      type: new GraphQLNonNull(GraphQLString),
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
        "On success: the created show event. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, showId, ...args },
    { createPartnerShowEventLoader }
  ) => {
    if (!createPartnerShowEventLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const showIdentifiers = { partnerID: partnerId, showID: showId }

    const gravityArgs: {
      start_at: number
      end_at: number
      event_type: string
      description?: string
      time_zone?: string
    } = {
      start_at: momentTimezone.tz(args.startAt, args.timeZone).unix(),
      end_at: momentTimezone.tz(args.endAt, args.timeZone).unix(),
      event_type: args.eventType,
      time_zone: args.timeZone,
    }

    if (args.description) {
      gravityArgs.description = args.description
    }

    try {
      const response = await createPartnerShowEventLoader(
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
