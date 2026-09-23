import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLList,
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
  ItineraryStopOpeningHoursInputType,
} from "../itineraryStop"
import {
  GravityItineraryStop,
  GravityItineraryStopOpeningHours,
} from "../types"
import { AddItineraryStopsMutationResponseOrErrorType } from "./addItineraryStopsMutationResponseOrError"

interface StopInputProps {
  itemType?: GravityItineraryStop["item_type"]
  itemID?: string
  eventType?: GravityItineraryStop["event_type"]
  eventID?: string
  title?: string
  address?: string
  imageURL?: string
  sourceStopID?: string
  sourceShareToken?: string
  latitude?: number
  longitude?: number
  startAt?: string
  endAt?: string
  timeZone?: string
  note?: string
  category?: string
  isFreeAdmission?: boolean
  sourceURL?: string
  openingHours?: GravityItineraryStopOpeningHours[]
}

interface InputProps {
  clientMutationId?: string
  itineraryID: string
  stops: StopInputProps[]
}

// Mirrors `createItineraryStopMutation`'s input fields, minus
// `itinerarySectionID`: the bulk Gravity endpoint resolves (or creates) the
// itinerary's own section itself.
export const ItineraryStopInput = new GraphQLInputObjectType({
  name: "ItineraryStopInput",
  fields: {
    itemType: { type: ItineraryStopItemType },
    itemID: { type: GraphQLString },
    eventType: { type: ItineraryStopEventType },
    eventID: { type: GraphQLString },
    title: { type: GraphQLString },
    address: { type: GraphQLString },
    imageURL: {
      description:
        "S3 upload URL for the stop image; Gravity converts it via " +
        "Gemini. Other URLs are rejected.",
      type: GraphQLString,
    },
    sourceStopID: {
      description:
        "Copy the processed image from a readable stop. Other stop fields must " +
        "be supplied separately. Cannot be combined with imageURL.",
      type: GraphQLString,
    },
    sourceShareToken: {
      description:
        "The source stop's parent itinerary share token, when unlisted",
      type: GraphQLString,
    },
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
    openingHours: {
      description:
        "Replaces the stop's opening hours. Omit to leave them " +
        "unchanged; pass `[]` to clear them.",
      type: new GraphQLList(
        new GraphQLNonNull(ItineraryStopOpeningHoursInputType)
      ),
    },
  },
})

export const addItineraryStopsMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "addItineraryStops",
  description:
    "Add several stops to an itinerary in one transactional request. " +
    "Gravity resolves or creates the itinerary's one section, titled " +
    "'My Stops' if it has to create one. A bad stop rolls back the whole " +
    "batch.",
  inputFields: {
    itineraryID: { type: new GraphQLNonNull(GraphQLString) },
    stops: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ItineraryStopInput))
      ),
    },
  },
  outputFields: {
    responseOrError: {
      type: AddItineraryStopsMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { clientMutationId: _clientMutationId, itineraryID, stops },
    context
  ) => {
    if (!context.addItineraryStopsLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    let createdStops

    try {
      createdStops = await context.addItineraryStopsLoader(itineraryID, {
        stops: stops.map((stop) => snakeCaseKeys(stop)),
      })
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw error
      }
    }

    // Enrichment failing must not report a committed write as failed.
    await attachItemsToStops(createdStops, context).catch(() => undefined)

    return { stops: createdStops }
  },
})
