import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ItinerarySectionMutationResponseOrErrorType } from "./itinerarySectionMutationResponseOrError"

interface InputProps {
  itineraryID: string
  title?: string
  note?: string
}

export const createItinerarySectionMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "createItinerarySection",
  description:
    "Not implemented yet in Metaphysics. Calling this mutation always throws.",
  inputFields: {
    itineraryID: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: GraphQLString },
    note: {
      type: GraphQLString,
      description: "Free-text note shown with the section.",
    },
  },
  outputFields: {
    responseOrError: {
      type: ItinerarySectionMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (_args, _context) => {
    throw new Error(
      "createItinerarySection is not implemented yet in Metaphysics."
    )
  },
})
