import { artworkConnection } from "./artwork"
import { GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { artworksArgs, artworksConnectionResolver } from "./partner"

export const ChecklistItemsType = new GraphQLObjectType<any, ResolverContext>({
  name: "ChecklistItemsType",
  fields: () => {
    return {
      artworkItemsConnection: {
        description:
          "Artworks missing priority metadata for a partner's checklist",
        type: artworkConnection.connectionType,
        args: pageable(artworksArgs),
        resolve: artworksConnectionResolver,
      },
    }
  },
})
