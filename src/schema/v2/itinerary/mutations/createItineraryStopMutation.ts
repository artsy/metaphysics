import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
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
    "Not implemented yet: Gravity's itinerary endpoints are not deployed. " +
    "Calling this mutation always throws.",
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
  mutateAndGetPayload: async (_args, _context) => {
    throw new Error(
      "createItineraryStop is not implemented yet: Gravity's itinerary " +
        "endpoints are not deployed."
    )
  },
})
