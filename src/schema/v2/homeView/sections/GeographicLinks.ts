import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../HomeViewSection"
import { connectionFromArray } from "graphql-relay"

export const GeographicLinks: HomeViewSection = {
  id: "home-view-section-geographic-links",

  contextModule: "ContextModule.geographic-links" as ContextModule,
  ownerType: "OwnerType.geographic-links" as OwnerType,

  type: HomeViewSectionTypeNames.HomeViewSectionFeaturedLinks,

  component: {
    title: "Browse by country",
  },

  requiresAuthentication: false,

  resolver: withHomeViewTimeout(async (_parent, args, _context, _info) => {
    const links = [
      { id: "angola", title: "Angola", href: "/gene/angola" },
      { id: "benin", title: "Benin", href: "/gene/benin" },
      { id: "cameroon", title: "Cameroon", href: "/gene/cameroon" },
      { id: "congo", title: "Congo", href: "/gene/congo" },
      { id: "ghana", title: "Ghana", href: "/gene/ghana" },
      { id: "ivory", title: "Ivory Coast", href: "/gene/ivory-coast" },
      { id: "kenya", title: "Kenya", href: "/gene/kenya" },
      { id: "mali", title: "Mali", href: "/gene/mali" },
      { id: "morocco", title: "Morocco", href: "/gene/morocco" },
      { id: "mozambique", title: "Mozambique", href: "/gene/mozambique" },
      { id: "nigeria", title: "Nigeria", href: "/gene/nigeria" },
      { id: "senegal", title: "Senegal", href: "/gene/senegal" },
      { id: "uganda", title: "Uganda", href: "/gene/uganda" },
      { id: "zimbabwe", title: "Zimbabwe", href: "/gene/zimbabwe" },
    ]

    return connectionFromArray(links, args)
  }),
}
