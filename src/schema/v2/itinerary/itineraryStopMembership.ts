import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { GravityItinerary, GravityItineraryStop } from "./types"

export interface ItineraryStopMembershipValue {
  itineraryID: string
  stopIDs: string[]
}

export const ItineraryStopMembershipType = new GraphQLObjectType<
  ItineraryStopMembershipValue
>({
  name: "ItineraryStopMembership",
  description:
    "A personal itinerary containing an equivalent stop, including every matching stop ID.",
  fields: {
    itineraryID: {
      type: new GraphQLNonNull(GraphQLString),
    },
    stopIDs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
    },
  },
})

export const itineraryStopMemberships = (
  source: GravityItineraryStop,
  itineraries: GravityItinerary[]
): ItineraryStopMembershipValue[] =>
  itineraries.map((itinerary) => ({
    itineraryID: itinerary.id,
    stopIDs: itinerary.sections
      .flatMap((section) => section.stops)
      .filter((candidate) => stopsMatch(source, candidate))
      .map((candidate) => candidate.id),
  }))

const stopsMatch = (
  source: GravityItineraryStop,
  candidate: GravityItineraryStop
) =>
  source.item_id
    ? candidate.item_type === source.item_type &&
      candidate.item_id === source.item_id
    : !candidate.item_id &&
      candidate.title === source.title &&
      candidate.address === source.address
