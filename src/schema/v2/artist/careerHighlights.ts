import {
  GraphQLFieldConfig,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { CareerHighlightType } from "../careerHighlight/careerHighlight"

const CareerHighlights: GraphQLFieldConfig<{ _id: string }, ResolverContext> = {
  type: new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(CareerHighlightType))
  ),
  args: {
    partnerId: {
      type: GraphQLString,
      description: "The slug or ID of the Partner",
    },
    solo: {
      type: GraphQLBoolean,
      description: "Filter by solo shows.",
    },
    group: {
      type: GraphQLBoolean,
      description: "Filter by group shows.",
    },
    collected: {
      type: GraphQLBoolean,
      description: "Filter by collected shows.",
    },
  },
  resolve: async ({ _id }, options, { artistCareerHighlightsLoader }) => {
    try {
      const response = await artistCareerHighlightsLoader(
        { artist_id: _id, ...options },
        options
      )

      if (!response || !Array.isArray(response)) {
        console.error(
          "[schema/v2/artist/careerHighlights.ts] Error: response is not an array or is null."
        )
        return []
      }

      return response
    } catch (error) {
      console.error(error)
      return []
    }
  },
}

export default CareerHighlights
