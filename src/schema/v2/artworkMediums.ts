import { GraphQLList, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import ArtworkMedium from "./artwork/artworkMedium"
import artworkMediums from "lib/artworkMediums"

const ArtworkMediums: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLList(ArtworkMedium),
  description: "List of all artwork mediums",
  resolve: (_root, _args, _context) => Object.values(artworkMediums),
}

export default ArtworkMediums
