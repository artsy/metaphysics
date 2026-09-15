import { GraphQLFieldConfig, GraphQLNonNull, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { HTTPError } from "lib/HTTPError"
import { CityGuideEventType } from "./cityGuideEvent"

export const CityGuideEvent: GraphQLFieldConfig<void, ResolverContext> = {
  type: CityGuideEventType,
  description: 'A City Guide event, e.g. "London Art Week"',
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The internal ID or slug of the City Guide Event",
    },
  },
  resolve: async (_root, { id }, { cityGuideEventLoader }) => {
    // Gravity 404s a draft event the caller can't read; resolve null rather than erroring.
    return cityGuideEventLoader(id).catch((error) => {
      if (error instanceof HTTPError && error.statusCode === 404) return null
      throw error
    })
  },
}

export default CityGuideEvent
