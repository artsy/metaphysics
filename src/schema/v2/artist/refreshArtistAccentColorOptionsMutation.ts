import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import config from "config"
import { isFeatureFlagEnabled } from "lib/featureFlags"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"
import { ResolverContext } from "types/graphql"
import { ArtistStoryAccentColorType } from "schema/v2/artistStory/artistStoryAccentColor"
import { toAccentColorOptions } from "./accentColorOptions"

interface Input {
  artistID: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "RefreshArtistAccentColorOptionsSuccess",
  isTypeOf: (data) => !!data && data._type !== "GravityMutationError",
  fields: () => ({
    accentColorOptions: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ArtistStoryAccentColorType))
      ),
      resolve: ({ hexColors }) => toAccentColorOptions(hexColors),
    },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "RefreshArtistAccentColorOptionsFailure",
  isTypeOf: (data) => !!data && data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "RefreshArtistAccentColorOptionsResponseOrError",
  types: [SuccessType, FailureType],
})

export const refreshArtistAccentColorOptionsMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "RefreshArtistAccentColorOptionsMutation",
  description: "Rebuild the accent color options of an artist",
  inputFields: {
    artistID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    responseOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (
    { artistID },
    { userID, refreshArtistAccentColorOptionsLoader }
  ) => {
    if (!userID || !refreshArtistAccentColorOptionsLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    // Read per call so tests can toggle it.
    const isDevelopment = config.NODE_ENV === "development"

    if (
      !isDevelopment &&
      !isFeatureFlagEnabled("fireworksq4_edit-artist-story", { userId: userID })
    ) {
      throw new Error("This feature is not currently enabled")
    }

    try {
      const hexColors = await refreshArtistAccentColorOptionsLoader({
        artist_id: artistID,
      })

      return { hexColors }
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      }

      throw error
    }
  },
})
