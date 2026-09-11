import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { snakeCaseKeys } from "lib/helpers"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { attachStopItems } from "../stopItems"
import { ItineraryMutationResponseOrErrorType } from "./itineraryMutationResponseOrError"

interface InputProps {
  clientMutationId?: string
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
    "Update an itinerary. Pass `generateShareToken` or `revokeShareToken` " +
    "to manage its share link.",
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
  mutateAndGetPayload: async (
    { id, clientMutationId: _clientMutationId, ...attributes },
    context
  ) => {
    if (!context.updateItineraryLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    let itinerary

    try {
      itinerary = await context.updateItineraryLoader(
        id,
        snakeCaseKeys(attributes)
      )
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
