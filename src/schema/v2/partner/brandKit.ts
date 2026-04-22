import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"
import { date } from "../fields/date"
import Image, { normalizeImageData } from "../image"

export const BrandKitType = new GraphQLObjectType<any, ResolverContext>({
  name: "BrandKit",
  fields: () => ({
    ...InternalIDFields,
    partnerID: {
      type: GraphQLString,
      resolve: ({ partner_id }) => partner_id,
    },
    textColor: {
      type: GraphQLString,
      resolve: ({ text_color }) => text_color,
    },
    backgroundColor: {
      type: GraphQLString,
      resolve: ({ background_color }) => background_color,
    },
    ctaColor: {
      type: GraphQLString,
      resolve: ({ cta_color }) => cta_color,
    },
    fontFamily: {
      type: GraphQLString,
      resolve: ({ font_family }) => font_family,
    },
    fontWeight: {
      type: GraphQLString,
      resolve: ({ font_weight }) => font_weight,
    },
    fontStyle: {
      type: GraphQLString,
      resolve: ({ font_style }) => font_style,
    },
    logo: {
      type: Image.type,
      resolve: ({ image }) => normalizeImageData(image),
    },
    createdAt: date(),
    updatedAt: date(),
  }),
})
