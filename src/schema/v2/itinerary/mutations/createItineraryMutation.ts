import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { ItineraryMutationResponseOrErrorType } from "./itineraryMutationResponseOrError"

interface InputProps {
  citySlug: string
  name: string
  subtitle?: string
  description?: string
  authorName?: string
  isCurated?: boolean
  arImageID?: string
}

export const createItineraryMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "createItinerary",
  description:
    "Not implemented yet: Gravity's itinerary endpoints are not deployed. " +
    "Calling this mutation always throws.",
  inputFields: {
    citySlug: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    subtitle: { type: GraphQLString },
    description: { type: GraphQLString },
    authorName: { type: GraphQLString },
    isCurated: { type: GraphQLBoolean },
    arImageID: { type: GraphQLString },
  },
  outputFields: {
    responseOrError: {
      type: ItineraryMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (_args, _context) => {
    throw new Error(
      "createItinerary is not implemented yet: Gravity's itinerary " +
        "endpoints are not deployed."
    )
  },
})
