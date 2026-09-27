import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { attachItemsToStops } from "../stopItems"
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
  description: "Delete a stop by its id.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    responseOrError: {
      type: ItineraryStopMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id }, context) => {
    if (!context.deleteItineraryStopLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    let stop

    try {
      stop = await context.deleteItineraryStopLoader(id, {})
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw error
      }
    }

    // Lets a client read the item's `isOnMyItineraries` after the delete. Enrichment failing
    // must not report a committed delete as failed.
    await attachItemsToStops([stop], context).catch(() => undefined)

    return stop
  },
})
