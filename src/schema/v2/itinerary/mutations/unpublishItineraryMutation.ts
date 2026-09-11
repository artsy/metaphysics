import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ItineraryMutationResponseOrErrorType } from "./itineraryMutationResponseOrError"

interface InputProps {
  id: string
}

// Separate from `updateItinerary`: Gravity role-checks this transition
// and records who published and when.
export const unpublishItineraryMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "unpublishItinerary",
  description:
    "Not implemented yet in Metaphysics. Calling this mutation always throws.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    responseOrError: {
      type: ItineraryMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (_args, _context) => {
    throw new Error("unpublishItinerary is not implemented yet in Metaphysics.")
  },
})
