import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { snakeCaseKeys } from "lib/helpers"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { attachItemsToStops } from "../stopItems"
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
    "Update a section. `position` moves it among its itinerary's sections.",
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
  mutateAndGetPayload: async ({ id, ...attributes }, context) => {
    if (!context.updateItinerarySectionLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const section = await context.updateItinerarySectionLoader(
        id,
        snakeCaseKeys(attributes)
      )

      await attachItemsToStops(section.stops ?? [], context)

      return section
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
