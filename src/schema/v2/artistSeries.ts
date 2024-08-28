import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLID,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { GravityIDFields } from "./object_identification"
import { ArtistType } from "./artist"
import { markdown } from "./fields/markdown"
import Image, { getDefault, normalizeImageData } from "./image"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "./fields/pagination"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

const ArtistSeriesType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtistSeries",
  fields: () => {
    const {
      filterArtworksConnectionWithParams,
    } = require("./filterArtworksConnection")
    return {
      ...GravityIDFields,
      slug: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: ({ id }) => id,
      },
      title: {
        type: new GraphQLNonNull(GraphQLString),
      },
      artistIDs: {
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(GraphQLString))
        ),
        resolve: ({ artist_ids }) => artist_ids,
      },
      artists: {
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(ArtistType))
        ),
        args: {
          page: {
            type: GraphQLInt,
          },
          size: {
            type: GraphQLInt,
          },
        },
        resolve: ({ artist_ids }, args, { artistsLoader }) => {
          if (artist_ids.length === 0) return []

          const gravityArgs = {
            ids: artist_ids,
            ...args,
          }

          return artistsLoader(gravityArgs).then(({ body }) => body)
        },
      },
      description: {
        type: GraphQLString,
      },
      descriptionFormatted: markdown(({ description }) => description),
      published: {
        type: new GraphQLNonNull(GraphQLBoolean),
      },
      featured: {
        type: new GraphQLNonNull(GraphQLBoolean),
      },
      representativeArtworkID: {
        type: GraphQLID,
        resolve: ({ representative_artwork_id }) => representative_artwork_id,
      },
      forSaleArtworksCount: {
        type: new GraphQLNonNull(GraphQLInt),
        resolve: ({ for_sale_artworks_count }) => for_sale_artworks_count,
      },
      artworksCount: {
        type: new GraphQLNonNull(GraphQLInt),
        resolve: ({ artworks_count }) => artworks_count,
      },
      artworksCountMessage: {
        type: GraphQLString,
        resolve: ({ artworks_count, for_sale_artworks_count }) => {
          let artworksCountMessage

          if (for_sale_artworks_count) {
            artworksCountMessage = `${for_sale_artworks_count} available`
          } else {
            artworksCountMessage = `${artworks_count} ${
              artworks_count === 1 ? "work" : "works"
            }`
          }

          return artworksCountMessage
        },
      },
      image: {
        type: Image.type,
        resolve: async (
          { image_url, image_height, image_width, representative_artwork_id },
          _args,
          { artworkLoader }
        ) => {
          if (image_url) {
            return {
              image_url,
              original_width: image_width,
              original_height: image_height,
            }
          } else if (representative_artwork_id) {
            const { images } = await artworkLoader(representative_artwork_id)
            return normalizeImageData(getDefault(images))
          }
        },
      },
      filterArtworksConnection: filterArtworksConnectionWithParams(
        ({ _id }) => {
          return {
            artist_series_id: _id,
          }
        }
      ),
    }
  },
})

export const ArtistSeries: GraphQLFieldConfig<void, ResolverContext> = {
  type: ArtistSeriesType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  resolve: (_root, { id }, { artistSeriesLoader }) => {
    return artistSeriesLoader(id)
  },
}

export const ArtistSeriesConnectionType = connectionWithCursorInfo({
  nodeType: ArtistSeriesType,
}).connectionType

export const ArtistSeriesConnection = {
  type: ArtistSeriesConnectionType,
  args: pageable({
    artistID: {
      type: GraphQLID,
    },
    artworkID: {
      type: GraphQLID,
    },
    excludeIDs: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLID)),
    },
  }),
  resolve: async (_root, args, { artistSeriesListLoader }) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const gravityArgs = {
      page,
      size,
      total_count: true,
      artist_id: args.artistID,
      artwork_id: args.artworkID,
      exclude_ids: args.excludeIDs,
    }

    const { body, headers } = await artistSeriesListLoader(gravityArgs)

    const totalCount = parseInt(headers["x-total-count"] || "0", 10)

    return paginationResolver({
      args,
      body,
      offset,
      page,
      size,
      totalCount,
    })
  },
}
