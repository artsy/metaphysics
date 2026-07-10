import { GraphQLObjectType } from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { ArtnetNewsArticlesConnection } from "../../artnetNews"
import { NodeInterface } from "../../object_identification"
import { HomeViewSectionTypeNames } from "./names"
import {
  standardSectionFields,
  HomeViewGenericSectionInterface,
} from "./GenericSectionInterface"
import { emptyConnection } from "schema/v2/fields/pagination"

export const HomeViewArtnetNewsSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionArtnetNews,
  description: "An artnet News articles section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    artnetNewsArticlesConnection: {
      type: ArtnetNewsArticlesConnection.type,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})
