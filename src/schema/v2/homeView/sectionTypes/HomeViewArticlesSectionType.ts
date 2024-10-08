import { GraphQLObjectType } from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import ArticlesConnection from "../../articlesConnection"
import { NodeInterface } from "../../object_identification"
import { HomeViewSectionTypeNames } from "../HomeViewSectionTypeNames"
import { standardSectionFields } from "../standardSectionFields"
import { HomeViewGenericSectionInterface } from "../HomeViewGenericSectionInterface"

export const HomeViewArticlesSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionArticles,
  description: "An articles section in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    articlesConnection: {
      type: ArticlesConnection.type,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : [],
    },
  },
})
