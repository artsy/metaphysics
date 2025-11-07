import { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType } from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import {
  connectionWithCursorInfo,
  emptyConnection,
} from "../../fields/pagination"
import { NodeInterface } from "../../object_identification"
import { HomeViewGenericSectionInterface } from "./GenericSectionInterface"
import { HomeViewSectionTypeNames } from "./names"
import { standardSectionFields } from "./GenericSectionInterface"
import { HomeViewCardType } from "./Card"
import { HomeViewCardsSection } from "../sections/AuctionsHub"

const HomeViewCardConnectionType = connectionWithCursorInfo({
  nodeType: HomeViewCardType,
}).connectionType

export const HomeViewCardsSectionType = new GraphQLObjectType<
  HomeViewCardsSection,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionCards,
  description: "A section containing a list of navigation cards",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,
    trackItemImpressions: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: (parent) => !!parent.trackItemImpressions,
    },
    cardsConnection: {
      type: HomeViewCardConnectionType,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})
