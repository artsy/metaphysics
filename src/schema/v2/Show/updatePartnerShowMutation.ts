import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLBoolean,
  GraphQLList,
  GraphQLInputObjectType,
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
  description?: string
  displayOnPartnerProfile?: boolean
  endAt?: string
  fairBooth?: string
  fairId?: string
  featured?: boolean
  locationId?: string
  name?: string
  partnerId: string
  pressRelease?: string
  showId: string
  startAt?: string
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
    displayOnPartnerProfile: {
      type: GraphQLBoolean,
      description: "Should the show be displayed on the partner profile page?",
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
    fairLocation: {
      type: new GraphQLInputObjectType({
        name: "UpdatePartnerShowFairLocationInput",
        fields: {
          booth: {
            type: GraphQLString,
            description: "The booth of the show in the fair.",
          },
          floor: {
            type: GraphQLString,
            description: "The floor of the show in the fair",
          },
          hall: {
            type: GraphQLString,
            description: "The hall of the show in the fair",
          },
          pier: {
            type: GraphQLString,
            description: "The pier of the show in the fair",
          },
          room: {
            type: GraphQLString,
            description: "The room of the show in the fair",
          },
          section: {
            type: GraphQLString,
            description: "The section of the show in the fair",
          },
        },
      }),
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
      ...addField("display_on_partner_profile", args.displayOnPartnerProfile),
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
      ...addField("fair_location", args.fairLocation),
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
