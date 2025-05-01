import { ContextModule } from "@artsy/cohesion"
import { connectionFromArray } from "graphql-relay"
import { getExperimentVariant } from "lib/featureFlags"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"

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
  shouldBeDisplayed: (context) => {
    const variant = getExperimentVariant("diamond_discover-tab", {
      userId: context.userID,
    })

    const isDiscoverVariant =
      variant && variant.name === "variant-a" && variant.enabled

    return !isDiscoverVariant
  },
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
        image_url: marketingCollection.thumbnail,
      }
    })

    return connectionFromArray(cards, args)
  },
}
