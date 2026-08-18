import {
  GraphQLEnumType,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

// Positron occasionally returns "" (or other non-numeric values) for embed
// heights. GraphQLInt throws when asked to serialize those (e.g. `Int cannot
// represent non-integer value: ""`), so coerce to an integer when possible and
// null otherwise.
const toIntOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

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
      resolve: ({ height }) => toIntOrNull(height),
    },
    mobileHeight: {
      type: GraphQLInt,
      resolve: ({ mobile_height }) => toIntOrNull(mobile_height),
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
