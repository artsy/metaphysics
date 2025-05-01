import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { connectionFromArray } from "graphql-relay"
import { marketingCollectionCategories } from "lib/marketingCollectionCategories"
import { getExperimentVariant } from "lib/featureFlags"

const orderedCategoryKeys = [
  "Medium",
  "Movement",
  "Collect by Size",
  "Collect by Color",
  "Collect by Price",
  "Gallery",
]

export const ExploreByCategory: HomeViewSection = {
  id: "home-view-section-explore-by-category",
  contextModule: ContextModule.exploreBy,
  type: HomeViewSectionTypeNames.HomeViewSectionCards,
  component: {
    title: "Explore by Category",
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
  resolver: (_parent, args, _context, _info) => {
    const cards = orderedCategoryKeys.map((key) => {
      const category = marketingCollectionCategories[key]

      return {
        entityID: category.id,
        entityType: OwnerType.collectionsCategory,
        image_url: category.imageUrl,
        title: category.title,
      }
    })

    return connectionFromArray(cards, args)
  },
}
