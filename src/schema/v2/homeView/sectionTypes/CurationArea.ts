import { GraphQLObjectType } from "graphql"
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
