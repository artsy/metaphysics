export type MarketingCollectionCategoriesKeys =
  | "Medium"
  | "Movement"
  | "Collect by Size"
  | "Collect by Color"
  | "Collect by Price"
  | "Gallery"

// Gravity snake_cased params
type ArtworkFilterPayloads = {
  price_range: string
}
type ArtworkFiltersKeys = keyof ArtworkFilterPayloads
type ArtworkFiltersItem<K extends ArtworkFiltersKeys> = { title: string } & {
  [P in K]: ArtworkFilterPayloads[P]
}
export type ArtworkFilters = {
  [K in ArtworkFiltersKeys]?: readonly ArtworkFiltersItem<K>[]
}

type MarketingCollectionCategory = {
  id: string
  slug: string
  title: string
  href: string
  imageUrl: string
  sortedCollectionSlugs: readonly string[]
  artworkFilters?: ArtworkFilters
}

export const marketingCollectionCategories: Record<
  MarketingCollectionCategoriesKeys,
  MarketingCollectionCategory
> = {
  Medium: {
    id: "Medium",
    slug: "medium",
    title: "Medium",
    href: "/collections-by-category/medium",
    imageUrl:
      "https://files.artsy.net/images/collections-mediums-category.jpeg",
    sortedCollectionSlugs: [
      "painting",
      "sculpture",
      "works-on-paper",
      "prints",
      "drawing",
      "textile-art",
      "ceramics",
      "mixed-media",
      "design",
      "photography",
    ],
  },
  Movement: {
    id: "Movement",
    slug: "movement",
    title: "Movement",
    href: "/collections-by-category/movement",
    imageUrl:
      "https://files.artsy.net/images/collections-movement-category.jpeg",
    sortedCollectionSlugs: [
      "contemporary-art",
      "abstract-art",
      "impressionist-and-modern",
      "emerging-art",
      "minimalist-art",
      "street-art",
      "pop-art",
      "post-war",
      "20th-century-art",
      "pre-columbian-art",
    ],
  },
  "Collect by Size": {
    id: "Collect by Size",
    slug: "collect-by-size",
    title: "Size",
    href: "/collections-by-category/collect-by-size",
    imageUrl: "https://files.artsy.net/images/collections-size-category.jpeg",
    sortedCollectionSlugs: [
      "art-for-small-spaces",
      "art-for-large-spaces",
      "tabletop-sculpture",
    ],
  },
  "Collect by Color": {
    id: "Collect by Color",
    slug: "collect-by-color",
    title: "Color",
    href: "/collections-by-category/collect-by-color",
    imageUrl: "https://files.artsy.net/images/collections-color-category.png",
    sortedCollectionSlugs: [
      "black-and-white-artworks",
      "warm-toned-artworks",
      "cool-toned-artworks",
      "blue-artworks",
      "red-artworks",
      "neutral-artworks",
      "green-artworks",
      "yellow-artworks",
      "orange-artworks",
    ],
  },
  "Collect by Price": {
    id: "Collect by Price",
    slug: "collect-by-price",
    title: "Price",
    href: "/collections-by-filter/collect-by-price",
    imageUrl: "https://files.artsy.net/images/collections-price-category.jpeg",
    sortedCollectionSlugs: [
      "art-under-500-dollars",
      "art-under-1000-dollars",
      "art-under-2500-dollars",
      "art-under-5000-dollars",
      "art-under-10000-dollars",
      "art-under-25000-dollars",
      "art-under-50000-dollars",
    ] as const,
    artworkFilters: {
      price_range: [
        { title: "Art under $500", price_range: "*-500" },
        { title: "Art under $1000", price_range: "501-1000" },
        { title: "Art under $2500", price_range: "1001-2500" },
        { title: "Art under $5000", price_range: "2501-5000" },
        { title: "Art under $10000", price_range: "5001-10000" },
        { title: "Art under $25000", price_range: "10001-25000" },
        { title: "Art above $25000", price_range: "25001-*" },
      ],
    },
  },
  Gallery: {
    id: "Gallery",
    slug: "gallery",
    title: "Gallery",
    href: "/collections-by-category/gallery",
    imageUrl:
      "https://files.artsy.net/images/collections-gallery-category.jpeg",
    sortedCollectionSlugs: [
      "new-from-tastemaking-galleries",
      "new-from-nonprofits-acaf27cc-2d39-4ed3-93dd-d7099e183691",
      "new-from-small-galleries",
      "new-from-leading-galleries",
      "new-to-artsy",
    ],
  },
} as const

export type MarketingCollectionsCategories = typeof marketingCollectionCategories

// export const collectByPriceHref: Record<PriceSlugs[number], string> = {
//   "art-under-500-dollars": "",
//   "art-under-1000-dollars": "",
//   "art-under-2500-dollars": "",
//   "art-under-5000-dollars": "",
//   "art-under-10000-dollars": "",
//   "art-under-25000-dollars": "",
//   "art-under-50000-dollars": "",
// }

// /collections-by-category/collect-by-price?filter_key[]="priceRange"&filter_title[]="Art%20under%20$500"&filter_value[]="%2A-500"&filter_key[]="priceRange"&filter_title[]="Art%20under%20$1000"&filter_value[]="501-1000"&slug="collect-by-price"&title=Collect%20by%20price
// /collections-by-category/collect-by-price?filters=[{"key":"priceRange","title":"Art under $500","value":"*-500"},{"key":"priceRange","title":"Art under $1000","value":"501-1000"}]&slug=collect-by-price&title=Collect%20by%20price
