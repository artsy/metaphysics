import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { snakeCaseKeys } from "lib/helpers"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { attachItemsToStops } from "../stopItems"
import { ItinerarySectionMutationResponseOrErrorType } from "./itinerarySectionMutationResponseOrError"

interface InputProps {
  clientMutationId?: string
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
  description: "Create a section in an itinerary.",
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
  mutateAndGetPayload: async (
    { clientMutationId: _clientMutationId, ...attributes },
    context
  ) => {
    if (!context.createItinerarySectionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    let section

    try {
      section = await context.createItinerarySectionLoader(
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
    await attachItemsToStops(section.stops ?? [], context).catch(
      () => undefined
    )

    return section
  },
})
