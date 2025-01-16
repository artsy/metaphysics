import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { NodeInterface } from "../../object_identification"
import { HomeViewGenericSectionInterface } from "./GenericSectionInterface"
import { HomeViewSectionTypeNames } from "./names"
import { standardSectionFields } from "./GenericSectionInterface"
import { QuickLink } from "../sections/QuickLinks"

const QuickLinkType = new GraphQLObjectType<QuickLink, ResolverContext>({
  name: "QuickLink",
  fields: () => ({
    title: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Quick link title",
    },
    href: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Quick link URL",
    },
    ownerType: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The context module for analytics",
    },
    contextScreenOwnerId: {
      type: GraphQLString,
      description: "The owner ID for the context module",
    },
  }),
})

export const HomeViewQuickLinksSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionQuickLinks,
  description: "A selection of quick links in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,
    quickLinks: {
      type: new GraphQLList(QuickLinkType),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : [],
    },
  },
})
