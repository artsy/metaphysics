import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { attachStopItems } from "../stopItems"
import { ItineraryMutationResponseOrErrorType } from "./itineraryMutationResponseOrError"

interface InputProps {
  id: string
}

// Separate from `updateItinerary`: Gravity role-checks this transition
// and records who published and when.
export const publishItineraryMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "publishItinerary",
  description: "Publish an itinerary. Needs the publish ability.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    responseOrError: {
      type: ItineraryMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, context) => {
    if (!context.publishItineraryLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    let itinerary

    try {
      itinerary = await context.publishItineraryLoader(id, {})
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw error
      }
    }

    // Enrichment failing must not report a committed write as failed.
    return attachStopItems(itinerary, context).catch(() => itinerary)
  },
})
