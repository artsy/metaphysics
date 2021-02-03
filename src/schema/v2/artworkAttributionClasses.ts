import { GraphQLList, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import AttributionClass from "./artwork/attributionClass"
import attributionClasses from "lib/attributionClasses"

const ArtworkAttributionClasses: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(AttributionClass),
  description: "List of all artwork attribution classes",
  resolve: (_root, _args, _context) => {
    return Object.values(attributionClasses)
  },
}

export default ArtworkAttributionClasses
