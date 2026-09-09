import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ItineraryStopMutationResponseOrErrorType } from "./itineraryStopMutationResponseOrError"

interface InputProps {
  id: string
}

// Deletes exactly one stop, by its own id. Removal is deliberately not by
// item: the same show can appear in one itinerary twice on purpose (two
// visits, or the show plus a talk inside it), so removing by item would take
// both when the viewer pointed at one. Every caller already holds the stop
// id — `ItineraryStop.internalID` is on the type the list is rendered from.
export const deleteItineraryStopMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "deleteItineraryStop",
  description:
    "Not implemented yet: Gravity's itinerary endpoints are not deployed. " +
    "Calling this mutation always throws.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    responseOrError: {
      type: ItineraryStopMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (_args, _context) => {
    throw new Error(
      "deleteItineraryStop is not implemented yet: Gravity's itinerary " +
        "endpoints are not deployed."
    )
  },
})
