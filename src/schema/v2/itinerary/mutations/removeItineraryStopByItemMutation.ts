import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { RemoveItineraryStopByItemResponseOrErrorType } from "./removeItineraryStopByItemResponseOrError"

interface InputProps {
  itineraryID: string
  itemType: string
  itemID: string
}

export const removeItineraryStopByItemMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "removeItineraryStopByItem",
  description:
    "Not implemented yet: Gravity's itinerary endpoints are not deployed. " +
    "Removes every stop in the given itinerary that references the given " +
    "item — not just one. Gravity has no uniqueness constraint on " +
    "(section, item), so the same item can legitimately appear more than " +
    "once in one itinerary; a client holding an item (e.g. a show) rather " +
    "than a stop id should use this instead of `deleteItineraryStop`, " +
    "which requires already knowing which stop references the item. " +
    "Calling this mutation always throws.",
  inputFields: {
    itineraryID: { type: new GraphQLNonNull(GraphQLString) },
    itemType: { type: new GraphQLNonNull(GraphQLString) },
    itemID: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    responseOrError: {
      type: RemoveItineraryStopByItemResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (_args, _context) => {
    throw new Error(
      "removeItineraryStopByItem is not implemented yet: Gravity's " +
        "itinerary endpoints are not deployed."
    )
  },
})
