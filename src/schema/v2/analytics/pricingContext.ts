import {
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { sortBy } from "lodash"
import { artistNames } from "schema/v2/artwork/meta"
import { amount } from "schema/v2/fields/money"
import { ResolverContext } from "types/graphql"
import { snakeCaseFields, stitchedAmountArgs } from "./shared"

/**
 * `Artwork.pricingContext`, served from Vortex's REST API. It replaces the
 * field the stitched Vortex schema added, with the same types.
 */

export const categoryMap = {
  Architecture: "ARCHITECTURE",
  "Books and Portfolios": "BOOKS_AND_PORTFOLIOS",
  "Design/Decorative Art": "DESIGN_DECORATIVE_ART",
  "Drawing, Collage or other Work on Paper":
    "DRAWING_COLLAGE_OTHER_WORK_ON_PAPER",
  "Fashion Design and Wearable Art": "FASHION",
  Installation: "INSTALLATION",
  Jewelry: "JEWELRY",
  "Mixed Media": "MIXED_MEDIA",
  Other: "OTHER",
  Painting: "PAINTING",
  "Performance Art": "PERFORMANCE",
  Photography: "PHOTOGRAPHY",
  Posters: "POSTERS",
  Print: "PRINT",
  Sculpture: "SCULPTURE",
  Sound: "SOUND",
  "Textile Arts": "TEXTILE",
  "Video/Film/Animation": "VIDEO_FILM_ANIMATION",
  "Work on Paper": "WORK_ON_PAPER",
}

export const categoryPluralization = {
  ARCHITECTURE: "architecture works",
  BOOKS_AND_PORTFOLIOS: "books and portfolios",
  DESIGN_DECORATIVE_ART: "design objects",
  DRAWING_COLLAGE_OTHER_WORK_ON_PAPER: "works on paper",
  FASHION: "wearable art",
  INSTALLATION: "installations",
  JEWELRY: "jewelry",
  MIXED_MEDIA: "mixed media",
  OTHER: "works",
  PAINTING: "paintings",
  PERFORMANCE: "performance art",
  PHOTOGRAPHY: "photographs",
  POSTERS: "posters",
  PRINT: "prints",
  SCULPTURE: "sculptures",
  SOUND: "sounds",
  TEXTILE: "textile art",
  VIDEO_FILM_ANIMATION: "video",
  WORK_ON_PAPER: "works on paper",
}

export const dimensionStrings = {
  LARGE: "large",
  MEDIUM: "medium-sized",
  SMALL: "small",
}

export const filtersDescription = ({ dimension, category }, artistNames) =>
  [
    "Price ranges of",
    dimensionStrings[dimension],
    categoryPluralization[category],
    category ? "by" : "works by",
    artistNames,
  ]
    .filter(Boolean)
    .join(" ")

// The highest price of an artwork or edition set: the single price, or the top
// of a range, as the stitched resolver read it from `listPrice`.
const maxPriceCents = ({ price_cents, price_currency }): number =>
  (price_currency && price_cents?.[price_cents.length - 1]) || 0

const isInAuction = async (
  { sale_ids },
  { salesLoader }: ResolverContext
): Promise<boolean> => {
  if (!sale_ids || sale_ids.length === 0) return false

  try {
    const sales = await salesLoader({ id: sale_ids, is_auction: true })
    return sales.length > 0
  } catch {
    // The stitched resolver saw the failed `isInAuction` as truthy.
    return true
  }
}

const PricingContextCategoryEnumType = new GraphQLEnumType({
  name: "AnalyticsPricingContextCategoryEnum",
  values: Object.fromEntries(
    Object.entries(categoryMap).map(([description, name]) => [
      name,
      { description },
    ])
  ),
})

const PricingContextDimensionEnumType = new GraphQLEnumType({
  name: "AnalyticsPricingContextDimensionEnum",
  values: {
    LARGE: { description: "Large" },
    MEDIUM: { description: "Medium" },
    SMALL: { description: "Small" },
  },
})

const PriceContextFilterType = new GraphQLObjectType<any, ResolverContext>({
  name: "AnalyticsPriceContextFilterType",
  description: "Price Context Filter Type",
  fields: {
    category: { type: PricingContextCategoryEnumType },
    dimension: { type: PricingContextDimensionEnumType },
  },
})

const priceField = (
  key: "min_price_cents" | "max_price_cents"
): GraphQLFieldConfig<any, ResolverContext> => ({
  type: GraphQLString,
  args: stitchedAmountArgs,
  resolve: (bin, args) => amount(() => bin[key]).resolve({}, args),
})

const HistogramBinType = new GraphQLObjectType<any, ResolverContext>({
  name: "AnalyticsHistogramBin",
  description: "A histogram bin",
  fields: snakeCaseFields({
    maxPrice: priceField("max_price_cents"),
    maxPriceCents: { type: new GraphQLNonNull(GraphQLInt) },
    minPrice: priceField("min_price_cents"),
    minPriceCents: { type: new GraphQLNonNull(GraphQLInt) },
    numArtworks: { type: new GraphQLNonNull(GraphQLInt) },
  }),
})

const PricingContextType = new GraphQLObjectType<any, ResolverContext>({
  name: "AnalyticsPricingContext",
  description: "Pricing Context Histogram",
  fields: snakeCaseFields({
    appliedFilters: { type: new GraphQLNonNull(PriceContextFilterType) },
    appliedFiltersDisplay: {
      type: GraphQLString,
      resolve: ({ applied_filters, artistNames }) =>
        filtersDescription(applied_filters, artistNames),
    },
    bins: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(HistogramBinType))
      ),
    },
  }),
})

/**
 * Each input is derived from the Gravity artwork the way the Artwork field
 * the stitched resolver selected resolves it.
 */
export const ArtworkPricingContextField: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  type: PricingContextType,
  resolve: async (artwork, _args, context) => {
    const {
      artists,
      category,
      edition_sets,
      forsale,
      price_currency: priceCurrency,
      price_hidden: isPriceHidden,
      sold,
    } = artwork
    const isForSale = forsale && !sold

    // The edition with the highest price; on a tie, the last one.
    const edition = sortBy(
      [artwork, ...(Array.isArray(edition_sets) ? edition_sets : [])]
        .filter((e) => e.size_score)
        .map((e) => ({ price: maxPriceCents(e), sizeScore: e.size_score })),
      "price"
    ).pop()

    if (!edition) {
      return null
    }

    const { price, sizeScore } = edition

    // fail if we don't have enough info to request a histogram
    if (
      isPriceHidden ||
      priceCurrency !== "USD" ||
      (artists && artists.length > 1) ||
      !isForSale ||
      !price ||
      !artwork.artist ||
      !sizeScore ||
      !category
    ) {
      return null
    }

    const vortexSupportedCategory = categoryMap[category]

    // Don't show the histogram if the category is "Other"
    if (
      !vortexSupportedCategory ||
      vortexSupportedCategory === categoryMap.Other
    ) {
      return null
    }

    const [inAuction, artist] = await Promise.all([
      isInAuction(artwork, context),
      context.artistLoader(artwork.artist.id).catch(() => null),
    ])

    if (inAuction || !artist || artist.disable_price_context) {
      return null
    }

    const { data } = await context.unauthenticatedLoaders.pricingContextLoader({
      artist_id: artist._id,
      category: vortexSupportedCategory,
      size_score: Math.round(sizeScore),
    })

    // passed down so appliedFiltersDisplay can use it
    return data ? { ...data, artistNames: artistNames(artwork) } : null
  },
}
