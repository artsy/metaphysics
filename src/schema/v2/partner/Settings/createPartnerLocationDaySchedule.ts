import {
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
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
import { LocationType } from "schema/v2/location"
import { ResolverContext } from "types/graphql"

type DayScheduleInput = {
  day: number
  startTime: number
  endTime: number
}

interface Input {
  partnerId: string
  locationId: string
  daySchedules: DayScheduleInput[]
}

const DayScheduleInputType = new GraphQLInputObjectType({
  name: "DayScheduleInput",
  fields: {
    day: { type: new GraphQLNonNull(GraphQLInt) },
    startTime: { type: new GraphQLNonNull(GraphQLInt) },
    endTime: { type: new GraphQLNonNull(GraphQLInt) },
  },
})

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerLocationDayScheduleSuccess",
  isTypeOf: (data) => !!data._id,
  fields: () => ({
    location: {
      type: LocationType,
      resolve: (result) => result,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerLocationDayScheduleFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreatePartnerLocationDayScheduleOrError",
  types: [SuccessType, FailureType],
})

export const CreatePartnerLocationDayScheduleMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "CreatePartnerLocationDaySchedule",
  description: "Creates a new weekly schedule for a partner location",
  inputFields: {
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the partner",
    },
    locationId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ID of the location",
    },
    daySchedules: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(DayScheduleInputType))
      ),
      description: "List of day schedules for the full week",
    },
  },
  outputFields: {
    partnerLocationOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, locationId, daySchedules },
    { createPartnerLocationDayScheduleLoader }
  ) => {
    if (!createPartnerLocationDayScheduleLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const snakeCasedDaySchedules = daySchedules.map(
        ({ day, startTime, endTime }) => ({
          day,
          start_time: startTime,
          end_time: endTime,
        })
      )

      const response = await createPartnerLocationDayScheduleLoader({
        partnerId,
        locationId,
        day_schedules: snakeCasedDaySchedules,
      })

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
