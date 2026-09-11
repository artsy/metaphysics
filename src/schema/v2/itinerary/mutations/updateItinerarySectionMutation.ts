import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ItinerarySectionMutationResponseOrErrorType } from "./itinerarySectionMutationResponseOrError"

interface InputProps {
  id: string
  title?: string
  note?: string
  position?: number
}

export const updateItinerarySectionMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "updateItinerarySection",
  description:
    "Not implemented yet in Metaphysics. Calling this mutation always throws.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: GraphQLString },
    note: {
      type: GraphQLString,
      description: "Free-text note shown with the section.",
    },
    position: {
      description:
        "Reorders the section among its itinerary's sections via " +
        "acts_as_list's insert_at. There is no separate reposition " +
        "mutation for sections.",
      type: GraphQLInt,
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
      "updateItinerarySection is not implemented yet in Metaphysics."
    )
  },
})
