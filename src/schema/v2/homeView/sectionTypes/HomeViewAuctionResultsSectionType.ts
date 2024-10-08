import { GraphQLObjectType } from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { auctionResultConnection } from "../../auction_result"
import { NodeInterface } from "../../object_identification"
import { HomeViewGenericSectionInterface } from "../HomeViewGenericSectionInterface"
import { HomeViewSectionTypeNames } from "../HomeViewSectionTypeNames"
import { standardSectionFields } from "../standardSectionFields"

export const HomeViewAuctionResultsSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionAuctionResults,
  description: "An auction results section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    auctionResultsConnection: {
      type: auctionResultConnection.connectionType,
      args: pageable({}),
      resolve: (parent, ...rest) => {
        return parent.resolver ? parent.resolver(parent, ...rest) : []
      },
    },
  },
})
