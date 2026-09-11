import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { snakeCaseKeys } from "lib/helpers"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { attachItemsToStops } from "../stopItems"
import { ItineraryStopCategory } from "../itineraryStop"
import { ItineraryStopMutationResponseOrErrorType } from "./itineraryStopMutationResponseOrError"

interface InputProps {
  id: string
  itemType?: string
  itemID?: string
  eventType?: string
  eventID?: string
  title?: string
  address?: string
  imageURL?: string
  latitude?: number
  longitude?: number
  startAt?: string
  endAt?: string
  timeZone?: string
  note?: string
  category?: string
  isFreeAdmission?: boolean
  sourceURL?: string
  position?: number
}

export const updateItineraryStopMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "updateItineraryStop",
  description:
    "Update a stop. `position` moves it among its section's stops. " +
    "`isFreeAdmission: null` clears the override.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    itemType: { type: GraphQLString },
    itemID: { type: GraphQLString },
    eventType: { type: GraphQLString },
    eventID: { type: GraphQLString },
    title: { type: GraphQLString },
    address: { type: GraphQLString },
    imageURL: { type: GraphQLString },
    latitude: { type: GraphQLFloat },
    longitude: { type: GraphQLFloat },
    startAt: { type: GraphQLString },
    endAt: { type: GraphQLString },
    timeZone: {
      type: GraphQLString,
      description: "IANA time zone identifier, e.g. Europe/London.",
    },
    note: { type: GraphQLString },
    category: { type: ItineraryStopCategory },
    isFreeAdmission: { type: GraphQLBoolean },
    sourceURL: { type: GraphQLString },
    position: {
      description:
        "Reorders the stop among its section's stops via acts_as_list's " +
        "insert_at. There is no separate reposition mutation for stops.",
      type: GraphQLInt,
    },
  },
  outputFields: {
    responseOrError: {
      type: ItineraryStopMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id, ...attributes }, context) => {
    if (!context.updateItineraryStopLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const stop = await context.updateItineraryStopLoader(
        id,
        snakeCaseKeys(attributes)
      )

      await attachItemsToStops([stop], context)

      return stop
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw error
      }
    }
  },
})
