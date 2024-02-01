import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { ArtworkType, artworkResolver } from "schema/v2/artwork"
import { artworkLayers } from "schema/v2/artwork/layers"
import ArtworkLayer from "schema/v2/artwork/layer"
import { RequestErrorType } from "schema/v2/fields/requestError"
import { SlugAndInternalIDFields } from "../object_identification"
import _ from "lodash"
import Context from "schema/v2/artwork/context"
import { ArtworkContextGrids } from "schema/v2/artwork/artworkContextGrids"

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
          ...SlugAndInternalIDFields,

          context: Context,
          contextGrids: ArtworkContextGrids,

          layer: {
            type: ArtworkLayer.type,
            args: { id: { type: GraphQLString } },
            resolve: (artwork, { id }, { relatedLayersLoader }) => {
              return artworkLayers(
                artwork.id,
                relatedLayersLoader
              ).then((layers) =>
                !!id ? _.find(layers, { id }) : _.first(layers)
              )
            },
          },
        },
      }),
      resolve: async ({ artwork }, _, { artistLoader, partnerLoader }) => {
        if (!artwork) return null

        const { artist_ids, partner_id: partnerID } = artwork
        const artistID = artist_ids[0]
        return {
          ...artwork,

          // Inject resolved data, in order to better match `Artwork` shape.
          //
          // TODO: Consider moving this upstream to Gravity, where a partial
          // artwork 404 response should better match the shape of the full one.
          artist: !!artistID ? await artistLoader(artistID) : null,
          partner: !!partnerID ? await partnerLoader(partnerID) : null,
        }
      },
    },

    requestError: {
      type: RequestErrorType,
    },
  },
})

const ArtworkResultType = new GraphQLUnionType<any, ResolverContext>({
  name: "ArtworkResult",
  types: [ArtworkErrorType, ArtworkType],
  resolveType: ({ requestError }) => {
    if (_.isEmpty(requestError)) return ArtworkType

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
