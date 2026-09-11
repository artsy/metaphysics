import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { attachStopItems } from "../stopItems"
import { ItineraryMutationResponseOrErrorType } from "./itineraryMutationResponseOrError"

interface InputProps {
  id: string
  shareToken?: string
}

export const copyItineraryMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "copyItinerary",
  description:
    "Copy an itinerary into the caller's account. `shareToken` is needed " +
    "for an unlisted source.",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    shareToken: {
      description:
        "The share token of the itinerary being copied, required to copy " +
        "an unlisted itinerary the caller does not own",
      type: GraphQLString,
    },
  },
  outputFields: {
    responseOrError: {
      type: ItineraryMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id, shareToken }, context) => {
    if (!context.copyItineraryLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const itinerary = await context.copyItineraryLoader(
        id,
        shareToken ? { share_token: shareToken } : {}
      )

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
