import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLBoolean,
  GraphQLList,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import Show from "../show"
import moment from "moment"

interface UpdatePartnerShowMutationInputProps {
  partnerId: string
  showId: string
  featured?: boolean
  description?: string
  endAt?: string
  locationId?: string
  name?: string
  pressRelease?: string
  startAt?: string
  fairId?: string
  fairBooth?: string
  viewingRoomIds?: string[]
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
  description: "Updates a partner show.",
  inputFields: {
    description: {
      type: GraphQLString,
      description: "The description of the show.",
    },
    endAt: {
      type: GraphQLString,
      description: "The end date of the show.",
    },
    featured: {
      type: GraphQLBoolean,
      description: "Is the show featured?",
    },
    locationId: {
      type: GraphQLString,
      description: "The location id of the show.",
    },
    name: {
      type: GraphQLString,
      description: "The name of the show.",
    },
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the partner to update.",
    },
    pressRelease: {
      type: GraphQLString,
      description: "The press release of the show.",
    },
    showId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the show to update.",
    },
    startAt: {
      type: GraphQLString,
      description: "The start date of the show.",
    },
    fairId: {
      type: GraphQLString,
      description: "The id of the fair to update the show for.",
    },
    fairBooth: {
      type: GraphQLString,
      description: "The booth of the fair to update the show for.",
    },
    viewingRoomIds: {
      type: new GraphQLList(GraphQLString),
      description: "The viewing room ids of the show.",
    },
  },
  outputFields: {
    showOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the updated partner show. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, showId, ...args },
    { updatePartnerShowLoader }
  ) => {
    if (!updatePartnerShowLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const showIdentifiers = { partnerId, showId }

    const addField = (key, value) =>
      value !== undefined ? { [key]: value } : {}

    const gravityArgs = {
      ...addField("name", args.name),
      ...addField("featured", args.featured),
      ...addField("description", args.description),
      ...addField("press_release", args.pressRelease),
      ...addField("partner_location", args.locationId),
      ...addField(
        "start_at",
        args.startAt !== undefined ? moment(args.startAt).unix() : undefined
      ),
      ...addField(
        "end_at",
        args.endAt !== undefined ? moment(args.endAt).unix() : undefined
      ),
      ...addField("fair", args.fairId),
      ...addField(
        "fair_location",
        args.fairBooth !== undefined ? { booth: args.fairBooth } : undefined
      ),
      ...addField("viewing_room_ids", args.viewingRoomIds),
    }

    try {
      const response = await updatePartnerShowLoader(
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
