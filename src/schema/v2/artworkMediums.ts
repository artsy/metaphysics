import { GraphQLList, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import AttributionClass from "./artwork/mediumType"
import artworkMediums from "lib/artworkMediums"

const ArtworkMediums: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(AttributionClass),
  description: "List of all artwork mediums",
  resolve: (_root, _args, _context) => Object.values(artworkMediums),
}

export default ArtworkMediums
