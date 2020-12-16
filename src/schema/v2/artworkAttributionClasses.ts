import { GraphQLList, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import config from "../../config"
import AttributionClass from "./artwork/attributionClass"
import attributionClasses from "lib/attributionClasses"

const { EXCLUDE_DEPRECATED_ATTRIBUTION_CLASSES } = config

const ArtworkAttributionClasses: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(AttributionClass),
  description: "List of all artwork attribution classes",
  resolve: (_root, _args, _context) => {
    let values = Object.values(attributionClasses)

    if (EXCLUDE_DEPRECATED_ATTRIBUTION_CLASSES) {
      values = values.filter((attributionClass) => !attributionClass.deprecated)
    }

    return values
  },
}

export default ArtworkAttributionClasses
