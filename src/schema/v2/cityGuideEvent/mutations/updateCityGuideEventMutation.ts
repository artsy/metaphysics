import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { snakeCaseKeys } from "lib/helpers"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityGuideEventMutationResponseOrErrorType } from "./cityGuideEventMutationResponseOrError"

interface InputProps {
  clientMutationId?: string
  id: string
  title?: string
  citySlug?: string
  startAt?: string
  endAt?: string
  displayStartAt?: string | null
  displayEndAt?: string | null
  subtitle?: string
  description?: string
  timeZone?: string
  imageURL?: string | null
}

export const updateCityGuideEventMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "updateCityGuideEvent",
  description: "Update a city guide event. Only the fields sent are changed.",
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The event's id or slug.",
    },
    title: { type: GraphQLString },
    citySlug: {
      type: GraphQLString,
      description: "A featured city's slug, e.g. london-united-kingdom.",
    },
    startAt: {
      type: GraphQLString,
      description: "ISO 8601 datetime, e.g. 2026-10-05T00:00:00Z.",
    },
    endAt: {
      type: GraphQLString,
      description: "ISO 8601 datetime. Must not be before `startAt`.",
    },
    subtitle: { type: GraphQLString },
    displayStartAt: {
      type: GraphQLString,
      description: "Display from (ISO 8601). Null defaults to startAt.",
    },
    displayEndAt: {
      type: GraphQLString,
      description: "Display until (ISO 8601). Null defaults to endAt.",
    },
    description: { type: GraphQLString },
    timeZone: {
      type: GraphQLString,
      description: "IANA time zone identifier, e.g. Europe/London.",
    },
    imageURL: {
      description:
        "URL of an image already uploaded to S3, from which Gravity " +
        "builds the event's hero `ArImage`. Pass `null` to clear the " +
        "current hero image.",
      type: GraphQLString,
    },
  },
  outputFields: {
    responseOrError: {
      type: CityGuideEventMutationResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { id, clientMutationId: _clientMutationId, ...attributes },
    context
  ) => {
    if (!context.updateCityGuideEventLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await context.updateCityGuideEventLoader(
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
  },
})
