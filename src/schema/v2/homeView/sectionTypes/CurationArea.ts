import {
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

/** A reference to a section rendered as a rail inside a curation area. */
export interface HomeViewCurationAreaRailRef {
  /** Internal id of the referenced section. */
  sectionID: string
  /** Optional label override; falls back to the section's own component.title. */
  title?: string
}

export interface HomeViewCurationAreaSection extends HomeViewSection {
  /** Ordered rails (0..N) rendered inside the container, each a referenced section. */
  rails?: HomeViewCurationAreaRailRef[]
  /** Header for the chips group (e.g. "Art News"). */
  chipsTitle?: string
  /** "View all" href for the chips group (e.g. "/news"). */
  chipsHref?: string
  /** [Analytics] owner type for the chips group's "view all" tap. */
  chipsOwnerType?: string
  /** Background tint for the whole area (raw hex; null → untinted). */
  backgroundColor?: string
}

/**
 * A single rail within a curation area: a referenced section plus an optional
 * label override so the container's copy can diverge from the standalone rail.
 */
const HomeViewCurationAreaRailType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "HomeViewCurationAreaRail",
  description: "A referenced section rendered as a rail inside a curation area",
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

/**
 * A "curation area": a titled container holding an ordered set of rails
 * (0..N referenced sections) and/or an optional group of entry chips.
 * Consolidates several standalone rails into a single discovery block —
 * e.g. rails-only ("What's Happening"), one rail + chips ("Artsy Editorial"),
 * or chips-only ("Curated").
 */
export const HomeViewCurationAreaSectionType = new GraphQLObjectType<
  HomeViewCurationAreaSection,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionCurationArea,
  description:
    "A curation area: an ordered set of rails and/or a group of entry chips",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    // Ordered rails shown inside the container. Each is a referenced section
    // resolved by reference (its own resolver stays lazy), with an optional
    // label override. Non-displayable members are dropped. Empty for chips-only
    // areas. Instance-owned labels let copy diverge from the standalone rails.
    rails: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(HomeViewCurationAreaRailType))
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

    // Instance-owned chips-group copy, so it can be edited without touching the
    // standalone rails the chips are sourced from. Null for rails-only areas.
    chipsTitle: {
      type: GraphQLString,
      resolve: (parent) => parent.chipsTitle,
    },
    chipsHref: {
      type: GraphQLString,
      description: "'View all' destination for the chips group.",
      resolve: (parent) => parent.chipsHref,
    },
    chipsOwnerType: {
      type: GraphQLString,
      description:
        "[Analytics] `owner type` for the chips group's 'view all' tap.",
      resolve: (parent) => parent.chipsOwnerType,
    },

    // TODO: emit a palette token (dark-mode-safe) rather than raw hex once
    // design-system tokens are exposed over the API — raw hex won't adapt to
    // dark mode, and can't be expressed as a token for custom tints (e.g. cream).
    backgroundColor: {
      type: GraphQLString,
      description:
        "Background tint for the whole area as a raw hex string (null → untinted).",
      resolve: (parent) => parent.backgroundColor,
    },

    // Entry chips. Reuses HomeViewCard (renders as "Chips" on the client). Each
    // chip carries a deep-link `href`; see the section definition for details.
    chipsConnection: {
      type: HomeViewCardConnectionType,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})
