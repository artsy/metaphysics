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
  /** Internal id of the referenced section. */
  sectionID: string
  /** Optional label override; falls back to the section's own component.title. */
  title?: string
}

/** A labeled group of entry chips within a section group. */
export interface HomeViewGroupChipGroup {
  /** Header for this chips group (e.g. "Art News"). */
  title?: string
  /** "View all" href for this chips group (e.g. "/news"). */
  href?: string
  /** [Analytics] owner type for this chips group's "view all" tap. */
  ownerType?: string
  /** Resolves this group's cards (a HomeViewCard connection). */
  resolver: GraphQLFieldResolver<any, ResolverContext>
}

export interface HomeViewGroupSection extends HomeViewSection {
  /** Ordered rails (0..N) rendered inside the container, each a referenced section. */
  rails?: HomeViewGroupRailRef[]
  /** Ordered groups of entry chips (0..N) shown below the rails. */
  chipsGroups?: HomeViewGroupChipGroup[]
  /** Background tint for the whole area (raw hex; null → untinted). */
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

const HomeViewGroupChipGroupType = new GraphQLObjectType<any, ResolverContext>({
  name: "HomeViewGroupChipGroup",
  description: "A labeled group of entry chips within a section group",
  fields: {
    title: {
      type: GraphQLString,
      resolve: ({ title }) => title,
    },
    href: {
      type: GraphQLString,
      description: "'View all' destination for this chips group.",
      resolve: ({ href }) => href,
    },
    ownerType: {
      type: GraphQLString,
      description:
        "[Analytics] `owner type` for this chips group's 'view all' tap.",
      resolve: ({ ownerType }) => ownerType,
    },
    // This group's chips. Reuses HomeViewCard (renders as "Chips" on the client).
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
    "A section group: an ordered set of rails and/or a group of entry chips",
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

    // Each group owns its header/"view all" + cards, so a block can have several rows.
    chipsGroups: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(HomeViewGroupChipGroupType))
      ),
      resolve: (parent) => parent.chipsGroups ?? [],
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
