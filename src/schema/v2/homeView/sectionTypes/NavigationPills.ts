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
import { OwnerType } from "@artsy/cohesion"
import { SemanticVersionNumber } from "lib/semanticVersioning"

export interface NavigationPill {
  title: string
  href: string
  ownerType: OwnerType
  icon?: string

  /**
   * The implementing section must enforce this check.
   * See QuickLinks for an example
   */
  minimumEigenVersion?: SemanticVersionNumber
}

const NavigationPillType = new GraphQLObjectType<
  NavigationPill,
  ResolverContext
>({
  name: "NavigationPill",
  fields: () => ({
    title: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Link title",
    },
    href: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Link URL",
    },
    ownerType: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The context module for analytics",
    },
    icon: {
      type: GraphQLString,
      description: "Icon file name",
    },
  }),
})

export const HomeViewNavigationPillsSectionType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionNavigationPills,
  description: "A selection of navigation links in the home view",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,
    navigationPills: {
      type: new GraphQLNonNull(new GraphQLList(NavigationPillType)),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : [],
    },
  },
})
