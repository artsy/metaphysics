import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { snakeCaseKeys } from "lib/helpers"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { attachStopItems } from "../stopItems"
import { ItineraryMutationResponseOrErrorType } from "./itineraryMutationResponseOrError"

interface InputProps {
  citySlug: string
  title: string
  subtitle?: string
  description?: string
  authorName?: string
  isCurated?: boolean
}

export const createItineraryMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "createItinerary",
  description: "Create an itinerary.",
  inputFields: {
    citySlug: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    subtitle: { type: GraphQLString },
    description: { type: GraphQLString },
    authorName: { type: GraphQLString },
    isCurated: { type: GraphQLBoolean },
  },
  outputFields: {
    responseOrError: {
      type: ItineraryMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (input, context) => {
    if (!context.createItineraryLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      const itinerary = await context.createItineraryLoader(
        snakeCaseKeys(input)
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
