import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ItineraryMutationResponseOrErrorType } from "./itineraryMutationResponseOrError"

interface InputProps {
  id: string
  citySlug?: string
  title?: string
  subtitle?: string
  description?: string
  authorName?: string
  isCurated?: boolean
  generateShareToken?: boolean
  revokeShareToken?: boolean
}

export const updateItineraryMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "updateItinerary",
  description:
    "Not implemented yet in Metaphysics. Calling this mutation always throws.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    citySlug: { type: GraphQLString },
    title: { type: GraphQLString },
    subtitle: { type: GraphQLString },
    description: { type: GraphQLString },
    authorName: { type: GraphQLString },
    isCurated: { type: GraphQLBoolean },
    generateShareToken: {
      description:
        "Generate a new share token for this itinerary, replacing any " +
        "existing one",
      type: GraphQLBoolean,
    },
    revokeShareToken: {
      description: "Revoke this itinerary's current share token, if any",
      type: GraphQLBoolean,
    },
  },
  outputFields: {
    responseOrError: {
      type: ItineraryMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (_args, _context) => {
    throw new Error("updateItinerary is not implemented yet in Metaphysics.")
  },
})
