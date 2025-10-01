import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { connectionFromArray } from "graphql-relay"

const marketingCollectionSlugs = [
  "most-loved",
  "understated",
  "art-gifts-under-1000-dollars",
  "transcendent",
  "best-bids",
  "statement-pieces",
  "little-gems",
  "feast-for-the-eyes",
  "street-art-edit",
  "icons",
  "bleeding-edge",
  "flora-and-fauna",
]

export const DiscoverSomethingNew: HomeViewSection = {
  id: "home-view-section-discover-something-new",
  contextModule: ContextModule.discoverSomethingNewRail,
  type: HomeViewSectionTypeNames.HomeViewSectionCards,
  component: {
    title: "Discover Something New",
    type: "Chips",
  },
  requiresAuthentication: false,
  maximumEigenVersion: { major: 8, minor: 77, patch: 0 },
  resolver: async (_parent, args, context, _info) => {
    const { body } = await context.marketingCollectionsLoader({
      slugs: marketingCollectionSlugs,
      size: 12,
    })

    const cards = body.map((marketingCollection) => {
      return {
        href: `/collection/${marketingCollection.slug}`,
        entityID: marketingCollection.id,
        entityType: "MarketingCollection",
        subtitle: marketingCollection.category,
        title: marketingCollection.title,
        imageURL: marketingCollection.thumbnail,
      }
    })

    return connectionFromArray(cards, args)
  },
}
