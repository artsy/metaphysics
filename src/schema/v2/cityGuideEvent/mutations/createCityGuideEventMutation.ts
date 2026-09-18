import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import { snakeCaseKeys } from "lib/helpers"
import { formatGravityError } from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { CityGuideEventMutationResponseOrErrorType } from "./cityGuideEventMutationResponseOrError"

interface InputProps {
  clientMutationId?: string
  title: string
  citySlug: string
  startAt: string
  endAt: string
  displayStartAt?: string | null
  displayEndAt?: string | null
  subtitle?: string
  description?: string
  timeZone?: string
  imageURL?: string
}

export const createCityGuideEventMutation = mutationWithClientMutationId<
  InputProps,
  any,
  ResolverContext
>({
  name: "createCityGuideEvent",
  description:
    "Create a city guide event. Needs the editorial or content-manager role.",
  inputFields: {
    title: { type: new GraphQLNonNull(GraphQLString) },
    citySlug: {
      type: new GraphQLNonNull(GraphQLString),
      description: "A featured city's slug, e.g. london-united-kingdom.",
    },
    startAt: {
      type: new GraphQLNonNull(GraphQLString),
      description: "ISO 8601 datetime, e.g. 2026-10-05T00:00:00Z.",
    },
    endAt: {
      type: new GraphQLNonNull(GraphQLString),
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
        "builds the event's hero `ArImage`",
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
    { clientMutationId: _clientMutationId, ...attributes },
    context
  ) => {
    if (!context.createCityGuideEventLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await context.createCityGuideEventLoader(snakeCaseKeys(attributes))
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
