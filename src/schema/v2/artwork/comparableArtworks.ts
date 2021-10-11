import {
  GraphQLNonNull,
  GraphQLString,
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLFieldConfig,
} from "graphql"
import { NodeInterface, InternalIDFields } from "../object_identification"
import { ResolverContext } from "types/graphql"
import { ArtistType } from "../artist"
import date from "../fields/date"
import Image, { normalizeImageData } from "schema/v2/image"

export const ComparableArtworksType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ComparableArtworks",
  interfaces: [NodeInterface],
  fields: () => ({
    ...InternalIDFields,
    title: {
      type: GraphQLString,
    },
    artistID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ artist_id }) => artist_id,
    },
    artist: {
      type: ArtistType,
      resolve: ({ artist }) => artist,
    },
    date,
    dateText: {
      type: GraphQLString,
      resolve: ({ date_text }) => date_text,
    },
    mediumText: {
      type: GraphQLString,
      resolve: ({ medium_text }) => medium_text,
    },
    categoryText: {
      type: GraphQLString,
      resolve: ({ category_text }) => category_text,
    },
    dimensionText: {
      type: GraphQLString,
      resolve: ({ dimension_text }) => dimension_text,
    },
    organization: {
      type: GraphQLString,
    },
    saleDate: date,
    saleDateText: {
      type: GraphQLString,
      resolve: ({ sale_date_text }) => sale_date_text,
    },
    saleTitle: {
      type: GraphQLString,
      resolve: ({ sale_title }) => sale_title,
    },
    currency: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    externalURL: {
      type: GraphQLString,
      resolve: ({ external_url }) => external_url,
    },
    boughtIn: {
      type: GraphQLBoolean,
      resolve: ({ bought_in }) => bought_in,
    },
    location: {
      type: GraphQLString,
    },
    images: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "ComparableArtworksImages",
        fields: {
          larger: {
            type: Image.type,
          },
          thumbnail: {
            type: Image.type,
          },
        },
      }),
      resolve: ({ images }) => {
        if (!images || images.length < 1) {
          return null
        }
        return {
          larger: normalizeImageData(images[0].larger),
          thumbnail: normalizeImageData(images[0].thumbnail),
        }
      },
    },
  }),
})

export const ComparableArtworks: GraphQLFieldConfig<void, ResolverContext> = {
  type: ComparableArtworksType,
  description: "An comparable artworks",
  args: {
    id: {
      description: "The ID artwork",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: (_root, { id }, { comparableArtworksLoader }) => {
    if (!comparableArtworksLoader) {
      return null
    }
    return comparableArtworksLoader(id)
  },
}
