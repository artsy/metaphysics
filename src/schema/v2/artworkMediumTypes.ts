import { GraphQLList, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import AttributionClass from "./artwork/mediumType"
import mediumTypes from "lib/mediumTypes"

const ArtworkMediumTypes: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(AttributionClass),
  description: "List of all artwork medium types",
  resolve: (_root, _args, _context) => Object.values(mediumTypes),
}

export default ArtworkMediumTypes
