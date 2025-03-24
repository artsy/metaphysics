import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLBoolean,
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
  featured: boolean
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
  description: "Updates a partner artist.",
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
      description: "The id of the artist to update.",
    },
    startAt: {
      type: GraphQLString,
      description: "The start date of the show.",
    },
  },
  outputFields: {
    showOrError: {
      type: ResponseOrErrorType,
      description:
        "On success: the updated partner. On error: the error that occurred.",
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

    const gravityArgs: {
      featured: any
      description: any
      press_release: any
      name: any
      location_id: any
      start_at?: any
      end_at?: any
    } = {
      featured: args.featured,
      description: args.description,
      press_release: args.pressRelease,
      name: args.name,
      location_id: args.locationId,
    }

    // Convert the date strings to Unix-style timestamps.
    if (args.startAt) {
      gravityArgs.start_at = moment(args.startAt).unix()
    }
    if (args.endAt) {
      gravityArgs.end_at = moment(args.endAt).unix()
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
