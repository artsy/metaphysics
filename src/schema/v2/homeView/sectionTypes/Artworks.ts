import { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType } from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "../../artwork"
import { emptyConnection } from "../../fields/pagination"
import { NodeInterface } from "../../object_identification"
import { HomeViewGenericSectionInterface } from "./GenericSectionInterface"
import { HomeViewSectionTypeNames } from "./names"
import { standardSectionFields } from "./GenericSectionInterface"
import { HomeViewSection } from "../sections"

export interface HomeViewArtworksSection extends HomeViewSection {
  enableItemsImpressionTracking?: boolean
}

export const HomeViewArtworksSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionArtworks,
  description: "An artworks section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    enableItemsImpressionTracking: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: (parent) => !!parent.enableItemsImpressionTracking,
    },
    artworksConnection: {
      type: artworkConnection.connectionType,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})
