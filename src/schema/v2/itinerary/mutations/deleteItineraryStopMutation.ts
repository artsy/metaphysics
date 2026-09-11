import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ItineraryStopMutationResponseOrErrorType } from "./itineraryStopMutationResponseOrError"

interface InputProps {
  id: string
}

// Deletes by stop id, not item id: the same show can appear twice in one
// itinerary.
export const deleteItineraryStopMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "deleteItineraryStop",
  description:
    "Not implemented yet in Metaphysics. Calling this mutation always throws.",
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
      "deleteItineraryStop is not implemented yet in Metaphysics."
    )
  },
})
