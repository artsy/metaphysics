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
export const unpublishItineraryMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "unpublishItinerary",
  description:
    "Unpublish an itinerary. Also revokes its share link, so it becomes " +
    "private. Needs the publish ability.",
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
    if (!context.unpublishItineraryLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const itinerary = await context.unpublishItineraryLoader(id, {})

      return attachStopItems(itinerary, context)
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw error
      }
    }
  },
})
