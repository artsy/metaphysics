import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ItineraryMutationResponseOrErrorType } from "./itineraryMutationResponseOrError"

interface InputProps {
  id: string
}

// Separate from `updateItinerary` because Gravity role-checks the
// publish/unpublish transition and records who published the guide and
// when — that's not just a field update.
export const publishItineraryMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "publishItinerary",
  description:
    "Not implemented yet: Gravity's itinerary endpoints are not deployed. " +
    "Calling this mutation always throws.",
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
    throw new Error(
      "publishItinerary is not implemented yet: Gravity's itinerary " +
        "endpoints are not deployed."
    )
  },
})
