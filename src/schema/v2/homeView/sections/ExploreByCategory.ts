import { ContextModule, OwnerType } from "@artsy/cohesion"
import { HomeViewSection } from "."
import { HomeViewSectionTypeNames } from "../sectionTypes/names"
import { connectionFromArray } from "graphql-relay"

const HOMEVIEW_SECTION_ID = "home-view-section-explore-by-category"

const marketingCollectionCategories = {
  Medium: {
    id: "Medium",
    title: "Medium",
    imageUrl:
      "https://files.artsy.net/images/collections-mediums-category.jpeg",
    href:
      '/collections-by-category/home-view-section-explore-by-category?slugs=["painting","sculpture","photography","prints-and-multiples","work-on-paper","design","drawing","installation","film-and-video","jewelry","performance-art","ceramics","textile-art","mixed-media"]',
  },
  Movement: {
    id: "Movement",
    title: "Movement",
    imageUrl:
      "https://files.artsy.net/images/collections-movement-category.jpeg",
    href:
      '/collections-by-category/home-view-section-explore-by-category?slugs=["contemporary-art","abstract-art","impressionist-and-modern","emerging-art","minimalist-art","street-art","pop-art","post-war","20th-century-art","pre-columbian-art"]',
  },
  "Collect by Size": {
    id: "Collect by Size",
    title: "Size",
    imageUrl: "https://files.artsy.net/images/collections-size-category.jpeg",
    href:
      '/collections-by-category/home-view-section-explore-by-category?slugs=["art-for-small-spaces","art-for-large-spaces","tabletop-sculpture"]',
  },
  "Collect by Color": {
    id: "Collect by Color",
    title: "Color",
    imageUrl: "https://files.artsy.net/images/collections-color-category.png",
    href:
      '/collections-by-category/home-view-section-explore-by-category?slugs=["black-and-white-artworks","warm-toned-artworks","cool-toned-artworks","blue-artworks","red-artworks","neutral-artworks","green-artworks","yellow-artworks","orange-artworks"]',
  },
  "Collect by Price": {
    id: "Collect by Price",
    title: "Price",
    imageUrl: "https://files.artsy.net/images/collections-price-category.jpeg",
    href:
      '/collections-by-category/home-view-section-explore-by-category?slugs=["art-under-500-dollars","art-under-1000-dollars","art-under-2500-dollars","art-under-5000-dollars","art-under-10000-dollars","art-under-25000-dollars","art-under-50000-dollars"]',
  },
  Gallery: {
    id: "Gallery",
    title: "Gallery",
    imageUrl:
      "https://files.artsy.net/images/collections-gallery-category.jpeg",
    href:
      '/collections-by-category/home-view-section-explore-by-category?slugs=["new-from-tastemaking-galleries","new-from-nonprofits-acaf27cc-2d39-4ed3-93dd-d7099e183691","new-from-small-galleries","new-from-leading-galleries","new-to-artsy"]',
  },
}

export const ExploreByCategory: HomeViewSection = {
  id: HOMEVIEW_SECTION_ID,
  featureFlag: "diamond_home-view-marketing-collection-categories",
  contextModule: ContextModule.exploreBy,
  type: HomeViewSectionTypeNames.HomeViewSectionCards,
  component: {
    title: "Explore by Category",
  },
  requiresAuthentication: false,
  resolver: (_parent, args, _context, _info) => {
    const cards = Object.values(marketingCollectionCategories).map(
      (category) => {
        return {
          ...category,
          entityID: category.id,
          entityType: OwnerType.collectionsCategory,
          image_url: category.imageUrl,
        }
      }
    )

    return connectionFromArray(cards, args)
  },
}
