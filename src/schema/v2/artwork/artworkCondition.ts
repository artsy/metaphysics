import { GraphQLEnumType, GraphQLObjectType, GraphQLString } from "graphql"
import { upperFirst } from "lodash"
import { ResolverContext } from "types/graphql"

export const ArtworkConditionType = new GraphQLObjectType<any, ResolverContext>(
  {
    name: "ArtworkCondition",
    fields: () => {
      return {
        value: {
          type: GraphQLString,
          resolve: ({ condition }) => {
            if (!condition) return

            return condition.toUpperCase()
          },
        },
        displayText: {
          type: GraphQLString,
          resolve: ({ condition }) => {
            if (!condition) return

            return upperFirst(condition.split("_").join(" "))
          },
        },
        description: {
          type: GraphQLString,
          resolve: (artwork) => {
            const { condition_description } = artwork
            if (!condition_description) return

            return upperFirst(condition_description)
          },
        },
      }
    },
  }
)

export const ArtworkConditionEnum = new GraphQLEnumType({
  name: "ArtworkConditionEnumType",
  values: {
    EXCELLENT: {
      value: "excellent",
    },
    VERY_GOOD: {
      value: "very_good",
    },
    GOOD: {
      value: "good",
    },
    FAIR: {
      value: "fair",
    },
  },
})
