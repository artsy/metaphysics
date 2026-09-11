import {
  GraphQLBoolean,
  GraphQLFloat,
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
  itinerarySectionID: string
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
}

export const createItineraryStopMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "createItineraryStop",
  description:
    "Add a stop to a section. A stop points at a show, a location or a " +
    "fair, or is a custom place with its own title and coordinates.",
  inputFields: {
    itinerarySectionID: { type: new GraphQLNonNull(GraphQLString) },
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
  },
  outputFields: {
    responseOrError: {
      type: ItineraryStopMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (input, context) => {
    if (!context.createItineraryStopLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const stop = await context.createItineraryStopLoader(snakeCaseKeys(input))

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
