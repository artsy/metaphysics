import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ItinerarySectionMutationResponseOrErrorType } from "./itinerarySectionMutationResponseOrError"

interface InputProps {
  id: string
}

export const deleteItinerarySectionMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "deleteItinerarySection",
  description:
    "Not implemented yet in Metaphysics. Calling this mutation always throws.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    responseOrError: {
      type: ItinerarySectionMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (_args, _context) => {
    throw new Error(
      "deleteItinerarySection is not implemented yet in Metaphysics."
    )
  },
})
