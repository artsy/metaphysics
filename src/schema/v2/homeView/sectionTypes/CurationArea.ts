import { GraphQLObjectType, GraphQLString } from "graphql"
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

export interface HomeViewCurationAreaSection extends HomeViewSection {
  /** Internal id of the section rendered as the lead rail inside the container. */
  leadSectionID?: string
  /** Sub-label for the lead rail; overrides the lead section's own title so copy
   * can diverge from the standalone rail (e.g. "Editorial" vs "Artsy Editorial"). */
  leadTitle?: string
  /** Header for the chips group (e.g. "Art News"). */
  chipsTitle?: string
  /** "View all" href for the chips group (e.g. "/news"). */
  chipsHref?: string
}

/**
 * A "curation area": one lead content rail displayed inside the container,
 * plus a row of entry chips linking out to other curation areas. Consolidates
 * several standalone rails (e.g. Curators' Picks + Recommended/Trending Artists)
 * into a single discovery block.
 */
export const HomeViewCurationAreaSectionType = new GraphQLObjectType<
  HomeViewCurationAreaSection,
  ResolverContext
>({
  name: HomeViewSectionTypeNames.HomeViewSectionCurationArea,
  description:
    "A curation area: one lead content rail plus entry chips to other curation areas",
  interfaces: [HomeViewGenericSectionInterface, NodeInterface],
  fields: {
    ...standardSectionFields,

    // Instance-owned sub-labels, so the curation area's copy can be edited
    // without touching the standalone rails it references. Null for areas that
    // just reuse the lead section's own title and show no chips header.
    leadTitle: {
      type: GraphQLString,
      resolve: (parent) => parent.leadTitle,
    },
    chipsTitle: {
      type: GraphQLString,
      resolve: (parent) => parent.chipsTitle,
    },
    chipsHref: {
      type: GraphQLString,
      description: "'View all' destination for the chips group.",
      resolve: (parent) => parent.chipsHref,
    },

    // The prominent lead rail shown inside the container (e.g. Curators' Picks).
    // Returned by reference so the lead section's own resolver (artworks, etc.)
    // stays lazy — the container resolver itself does no upstream work.
    leadSection: {
      type: HomeViewGenericSectionInterface,
      resolve: (parent, _args, context) => {
        if (!parent.leadSectionID) return null
        const section = registry[parent.leadSectionID]
        if (!section || !isSectionDisplayable(section, context)) return null
        return section
      },
    },

    // Entry chips to other curation areas. Reuses HomeViewCard (renders as
    // "Chips" on the client). Each chip carries a deep-link `href` and/or a
    // section reference (entityType: "HomeViewSection", entityID: <sectionID>);
    // see the section definition for the client precedence contract.
    chipsConnection: {
      type: HomeViewCardConnectionType,
      args: pageable({}),
      resolve: (parent, ...rest) =>
        parent.resolver ? parent.resolver(parent, ...rest) : emptyConnection,
    },
  },
})
