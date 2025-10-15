import { mutationWithClientMutationId } from "graphql-relay"
import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import {
  formatGravityError,
  GravityMutationErrorType,
} from "lib/gravityErrorHandler"

interface Input {
  artistId: string
}

const inputFields = {
  artistId: { type: new GraphQLNonNull(GraphQLString) },
}

interface GravityInput {
  artist_id: string
}

const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "ExcludeArtistFromDiscoverySuccess",
  isTypeOf: (data) => data.artist_id,
  fields: {
    artistId: {
      type: GraphQLString,
      resolve: ({ artist_id }) => artist_id,
    },
  },
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "ExcludeArtistFromDiscoveryFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: {
      type: GravityMutationErrorType,
      resolve: (err) => err,
    },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "ExcludeArtistFromDiscoveryResponseOrError",
  types: [SuccessType, FailureType],
})

export const excludeArtistFromDiscoveryMutation = mutationWithClientMutationId({
  name: "ExcludeArtistFromDiscovery",
  description:
    "Excludes an artist from appearing in Infinite Discovery recommendations.",
  inputFields,
  outputFields: {
    excludeArtistFromDiscoveryOrError: {
      type: ResponseOrErrorType,
      description: "On success: the excluded artist information.",
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async (args, { excludeArtistFromDiscoveryLoader }) => {
    if (!excludeArtistFromDiscoveryLoader) {
      throw new Error(
        "You need to pass a X-Access-Token header to perform this action"
      )
    }

    const excludeArtistFromDiscoveryPayload: GravityInput = {
      artist_id: args.artistId,
    }

    try {
      return await excludeArtistFromDiscoveryLoader(
        excludeArtistFromDiscoveryPayload
      )
    } catch (error) {
      const formattedErr = formatGravityError(error)

      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      } else {
        throw new Error(error)
      }
    }
  },
})
