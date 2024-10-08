import { GraphQLObjectType } from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { FeaturedLinkConnectionType } from "../../FeaturedLink/featuredLink"
import { emptyConnection } from "../../fields/pagination"
import { NodeInterface } from "../../object_identification"
import { HomeViewGenericSectionInterface } from "../HomeViewGenericSectionInterface"
import { HomeViewSectionTypeNames } from "./names"
import { standardSectionFields } from "../standardSectionFields"

export const HomeViewDiscoverMarketingCollectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionDiscoverMarketingCollections,
  description:
    "[deprecated in favor of `HomeViewSectionCards`] A section containing a list of curated marketing collections",

  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,
    linksConnection: {
      type: FeaturedLinkConnectionType,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})
