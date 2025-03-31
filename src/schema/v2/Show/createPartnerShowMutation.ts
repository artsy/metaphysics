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

interface CreatePartnerShowMutationInputProps {
  partnerId: string
  name: string
  description?: string
  startAt?: string
  endAt?: string
  locationId?: string
  featured?: boolean
  pressRelease?: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerShowSuccess",
  isTypeOf: (data) => data._id,
  fields: () => ({
    show: {
      type: Show.type,
      resolve: (show) => show,
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "CreatePartnerShowFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "CreatePartnerShowResponseOrError",
  types: [SuccessType, FailureType],
})

export const createPartnerShowMutation = mutationWithClientMutationId<
  CreatePartnerShowMutationInputProps,
  any,
  ResolverContext
>({
  name: "CreatePartnerShowMutation",
  description: "Creates a partner show.",
  inputFields: {
    description: {
      type: GraphQLString,
      description: "The description of the show.",
    },
    endAt: {
      type: new GraphQLNonNull(GraphQLString),
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
      type: new GraphQLNonNull(GraphQLString),
      description: "The name of the show.",
    },
    partnerId: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The id of the partner to create the show for.",
    },
    fairId: {
      type: GraphQLString,
      description: "The id of the fair to create the show for.",
    },
    fairBooth: {
      type: GraphQLString,
      description: "The booth of the fair to create the show for.",
    },
    pressRelease: {
      type: GraphQLString,
      description: "The press release of the show.",
    },
    startAt: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The start date of the show.",
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
        "On success: the created partner show. On error: the error that occurred.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { partnerId, ...args },
    { createPartnerShowLoader }
  ) => {
    if (!createPartnerShowLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    const gravityArgs: {
      name: string
      featured?: boolean
      description?: string
      press_release?: string
      partner_location?: string
      start_at?: number
      end_at?: number
      fair?: string
    } = {
      name: args.name,
      featured: args.featured,
      description: args.description,
      press_release: args.pressRelease,
      start_at: moment(args.startAt).unix(),
      end_at: moment(args.endAt).unix(),
      partner_location: args.locationId,
      fair: args.fairId,
      ...(args.fairBooth && { fair_location: { booth: args.fairBooth } }),
      viewing_room_ids: args.viewingRoomIds,
    }

    try {
      const response = await createPartnerShowLoader(partnerId, gravityArgs)

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
