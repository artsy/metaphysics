import {
  GraphQLEnumType,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const ArticleSectionEmbed = new GraphQLObjectType<any, ResolverContext>({
  name: "ArticleSectionEmbed",
  isTypeOf: (section) => {
    return section.type === "embed"
  },
  fields: () => ({
    url: {
      type: GraphQLString,
    },
    height: {
      type: GraphQLInt,
    },
    mobileHeight: {
      type: GraphQLInt,
      resolve: ({ mobile_height }) => mobile_height,
    },
    layout: {
      type: new GraphQLEnumType({
        name: "ArticleSectionEmbedLayout",
        values: {
          COLUMN_WIDTH: { value: "column_width" },
          OVERFLOW: { value: "overflow" },
          OVERFLOW_FILLWIDTH: { value: "overflow_fillwidth" },
          FILLWIDTH: { value: "fillwidth" },
        },
      }),
    },
  }),
})
