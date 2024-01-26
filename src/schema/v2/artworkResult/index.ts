import {
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import Artist from "schema/v2/artist"
import { ResolverContext } from "types/graphql"
import { ArtworkType, artworkResolver } from "schema/v2/artwork"
import ArtworkLayers, { artworkLayers } from "schema/v2/artwork/layers"
import { RequestErrorType } from "schema/v2/fields/requestError"

const ArtworkErrorType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtworkError",
  description:
    "An error type, potentially containing a partial artwork response",
  fields: {
    artwork: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "PartialArtwork",
        description:
          "An artwork with partial data. useful for rendering an error state",
        fields: {
          artists: {
            type: new GraphQLList(Artist.type),
            resolve: ({ artist_ids }, _, { artistLoader }) => {
              if (!artist_ids || !artist_ids.length) return []

              return Promise.all(
                artist_ids.map((artist_id) => artistLoader(artist_id))
              ).catch(() => [])
            },
          },

          layers: {
            type: ArtworkLayers.type,
            resolve: ({ id }, _options, { relatedLayersLoader }) =>
              artworkLayers(id, relatedLayersLoader),
          },
        },
      }),
    },

    requestError: {
      type: RequestErrorType,
    },
  },
})

const ArtworkResultType = new GraphQLUnionType<any, ResolverContext>({
  name: "ArtworkResult",
  types: [ArtworkErrorType, ArtworkType],
  resolveType: (artwork) => {
    if (artwork?.published) {
      return ArtworkType
    }

    return ArtworkErrorType
  },
})

const artworkErrorResolver = ({ statusCode, body }) => {
  const requestError = {
    statusCode: statusCode ?? 500,
  }

  try {
    const { artwork } = JSON.parse(body)

    return {
      requestError,
      artwork,
    }
  } catch {
    return {
      requestError,
    }
  }
}

export const ArtworkResult: GraphQLFieldConfig<void, ResolverContext> = {
  type: ArtworkResultType,
  description: "An artwork result",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the artwork",
    },
  },
  resolve: async (...args: Parameters<typeof artworkResolver>) => {
    try {
      return await artworkResolver(...args)
    } catch (error) {
      return artworkErrorResolver(error)
    }
  },
}
