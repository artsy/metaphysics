import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { withHomeViewTimeout } from "../helpers/withHomeViewTimeout"
import { HomeViewSectionTypeNames } from "../HomeViewSection"
import { connectionFromArray } from "graphql-relay"

export const DiscoverMarketingCollections: HomeViewSection = {
  id: "home-view-section-discover-marketing-collections",

  contextModule: "ContextModule.discover-marketing-collections" as ContextModule,
  ownerType: "OwnerType.discover-marketing-collections" as OwnerType,

  type: HomeViewSectionTypeNames.HomeViewSectionDiscoverMarketingCollections,

  component: {
    title: "Discover Something New",
  },

  requiresAuthentication: false,
  featureFlag: "diamond_home-view-marketing-collection-categories",

  resolver: withHomeViewTimeout(async (_parent, args, _context, _info) => {
    const links = [
      {
        id: "figurative-art",
        title: "Figurative Art",
        subtitle: "Movement",
        href: "/collection/figurative-art",
      },
      {
        id: "new-from-leading-galleries",
        title: "New From Leading Galleries",
        subtitle: "Gallery",
        href: "/collection/new-from-leading-galleries",
      },
      {
        id: "paintings",
        title: "Paintings",
        subtitle: "Medium",
        href: "/collection/paintings",
      },
      {
        id: "prints",
        title: "Prints",
        subtitle: "Medium",
        href: "/collection/prints",
      },
      {
        id: "street-art",
        title: "Street Art",
        subtitle: "Movement",
        href: "/collection/street-art",
      },
      {
        id: "black-and-white",
        title: "Black and White",
        subtitle: "Color",
        href: "collection/black-and-white-artworks",
      },

      {
        id: "art-under-1000",
        title: "Art Under $1,000",
        subtitle: "Price",
        href: "/collection/art-under-1000-dollars",
      },
      {
        id: "art-for-small-spaces",
        title: "Art for small spaces",
        subtitle: "Size",
        href: "/collection/art-for-small-spaces",
      },
      {
        id: "cool-toned-artworks",
        title: "Cool Toned Artworks",
        subtitle: "Color",
        href: "/collection/cool-toned-artworks",
      },
    ]

    return connectionFromArray(links, args)
  }),
}
