import {
  GraphQLFieldResolver,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { emptyConnection } from "../../fields/pagination"
import { NodeInterface } from "../../object_identification"
import {
  HomeViewGenericSectionInterface,
  standardSectionFields,
} from "./GenericSectionInterface"
import { HomeViewSectionTypeNames } from "./names"
import { HomeViewCardConnectionType } from "./Cards"
import { HomeViewSection, registry } from "../sections"
import { isSectionDisplayable } from "../helpers/isSectionDisplayable"

/** A reference to a section rendered as a rail inside a section group. */
export interface HomeViewGroupRailRef {
  sectionID: string
  title?: string
}

/** A labeled group of entry cards within a section group. */
export interface HomeViewGroupCardGroup {
  title?: string
  href?: string
  ownerType?: string
  resolver: GraphQLFieldResolver<any, ResolverContext>
}

export interface HomeViewGroupSection extends HomeViewSection {
  rails?: HomeViewGroupRailRef[]
  cardGroups?: HomeViewGroupCardGroup[]
  backgroundColor?: string
}

const HomeViewGroupRailType = new GraphQLObjectType<any, ResolverContext>({
  name: "HomeViewGroupRail",
  description: "A referenced section rendered as a rail inside a section group",
  fields: {
    title: {
      type: GraphQLString,
      description:
        "Label override for this rail; null → use the section's own title.",
      resolve: ({ title }) => title,
    },
    section: {
      type: HomeViewGenericSectionInterface,
      resolve: ({ section }) => section,
    },
  },
})

const HomeViewGroupCardGroupType = new GraphQLObjectType<any, ResolverContext>({
  name: "HomeViewGroupCardGroup",
  description: "A labeled group of entry cards within a section group",
  fields: {
    title: {
      type: GraphQLString,
      resolve: ({ title }) => title,
    },
    href: {
      type: GraphQLString,
      description: "'View all' destination for this cards group.",
      resolve: ({ href }) => href,
    },
    ownerType: {
      type: GraphQLString,
      description:
        "[Analytics] `owner type` for this cards group's 'view all' tap.",
      resolve: ({ ownerType }) => ownerType,
    },
    cardsConnection: {
      type: HomeViewCardConnectionType,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})

export const HomeViewGroupSectionType = new GraphQLObjectType<
  HomeViewGroupSection,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionGroup,
  description:
    "A section group: an ordered set of rails and/or a group of entry cards",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    // Referenced sections resolved lazily by id; non-displayable ones dropped.
    rails: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(HomeViewGroupRailType))
      ),
      resolve: (parent, _args, context) => {
        return (parent.rails ?? [])
          .map(({ sectionID, title }) => {
            const section = registry[sectionID]
            if (!section || !isSectionDisplayable(section, context)) return null
            return { title, section }
          })
          .filter(Boolean)
      },
    },

    cardGroups: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(HomeViewGroupCardGroupType))
      ),
      resolve: (parent) => parent.cardGroups ?? [],
    },

    // TODO: emit a dark-mode-safe palette token rather than raw hex once exposed over the API.
    backgroundColor: {
      type: GraphQLString,
      description:
        "Background tint for the whole area as a raw hex string (null → untinted).",
      resolve: (parent) => parent.backgroundColor,
    },
  },
})
