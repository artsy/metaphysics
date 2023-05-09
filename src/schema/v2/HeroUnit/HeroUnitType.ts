import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { InternalIDFields } from "../object_identification"
import { ResolverContext } from "types/graphql"
import Image, { normalizeImageData } from "../image"
import date from "schema/v2/fields/date"

interface HeroUnitGravityResponse {
  body: string
  created_at: string
  credit?: string
  end_at?: string
  image?: {
    image_url?: string
    image_urls?: string[]
    image_versions?: string[]
    original_height?: string
    original_width?: string
  }
  label?: string
  link_text: string
  link_url: string
  position?: number
  start_at?: string
  title: string
}

export const HeroUnitType = new GraphQLObjectType<
  HeroUnitGravityResponse,
  ResolverContext
>({
  name: "HeroUnit",
  description: "A Hero Unit",
  fields: {
    ...InternalIDFields,
    body: {
      description: "Main Hero Unit content.",
      type: new GraphQLNonNull(GraphQLString),
    },
    createdAt: date,
    credit: {
      description: "Optional image credit line.",
      type: GraphQLString,
    },
    endAt: date,
    image: {
      description: "The main image for the Hero Unit.",
      type: Image.type,
      resolve: ({ image }) => {
        if (!image) return null
        return normalizeImageData(image)
      },
    },
    label: {
      description: "Optional label for above the title.",
      type: GraphQLString,
    },
    link: {
      resolve: (response) => response,
      type: new GraphQLNonNull(
        new GraphQLObjectType<HeroUnitGravityResponse, ResolverContext>({
          name: "HeroUnitLink",
          fields: {
            text: {
              description: "Text for the CTA of the Hero Unit.",
              resolve: ({ link_text }) => link_text,
              type: new GraphQLNonNull(GraphQLString),
            },
            url: {
              description: "URL for the CTA of the Hero Unit.",
              resolve: ({ link_url }) => link_url,
              type: new GraphQLNonNull(GraphQLString),
            },
          },
        })
      ),
    },
    position: {
      description: "Dictates the order of the Hero Units.",
      type: GraphQLInt,
    },
    startAt: date,
    title: {
      description: "The main headline for the Hero Unit.",
      type: new GraphQLNonNull(GraphQLString),
    },
  },
})
