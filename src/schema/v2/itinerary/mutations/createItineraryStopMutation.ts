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
import {
  ItineraryStopCategory,
  ItineraryStopItemType,
  ItineraryStopEventType,
} from "../itineraryStop"
import { GravityItineraryStop } from "../types"
import { ItineraryStopMutationResponseOrErrorType } from "./itineraryStopMutationResponseOrError"

interface InputProps {
  clientMutationId?: string
  itinerarySectionID: string
  itemType?: GravityItineraryStop["item_type"]
  itemID?: string
  eventType?: GravityItineraryStop["event_type"]
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
    itemType: { type: ItineraryStopItemType },
    itemID: { type: GraphQLString },
    eventType: { type: ItineraryStopEventType },
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
  mutateAndGetPayload: async (
    { clientMutationId: _clientMutationId, ...attributes },
    context
  ) => {
    if (!context.createItineraryStopLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    let stop

    try {
      stop = await context.createItineraryStopLoader(snakeCaseKeys(attributes))
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw error
      }
    }

    // Enrichment failing must not report a committed write as failed.
    await attachItemsToStops([stop], context).catch(() => undefined)

    return stop
  },
})
