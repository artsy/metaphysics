import { ContextModule } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { connectionFromArray } from "graphql-relay"

const marketingCollectionSlugs = [
  "figurative-art",
  "new-from-leading-galleries",
  "paintings",
  "prints",
  "street-art",
  "black-and-white-artworks",
  "art-under-1000-dollars",
  "art-for-small-spaces",
  "cool-toned-artworks",
]

export const DiscoverSomethingNew: HomeViewSection = {
  id: "home-view-section-discover-something-new",
  featureFlag: "diamond_home-view-marketing-collection-categories",
  contextModule: ContextModule.discoverSomethingNewSection,
  type: HomeViewSectionTypeNames.HomeViewSectionCards,
  component: {
    title: "Discover Something New",
    type: "Chips",
  },
  requiresAuthentication: false,
  resolver: async (_parent, args, context, _info) => {
    const { body } = await context.marketingCollectionsLoader({
      slugs: marketingCollectionSlugs,
    })

    const cards = body.map((marketingCollection) => {
      return {
        href: `/collection/${marketingCollection.slug}`,
        entityID: marketingCollection.id,
        entityType: "MarketingCollection",
        // TODO: Include category in short JSON response
        // subtitle: marketingCollection.category,
        title: marketingCollection.title,
        image_url: marketingCollection.thumbnail,
      }
    })

    return connectionFromArray(cards, args)
  },
}
