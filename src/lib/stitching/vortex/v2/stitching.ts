import { executableVortexSchema } from "lib/stitching/vortex/schema"
import { amount } from "schema/v2/fields/money"
import { GraphQLSchema } from "graphql/type/schema"
import gql from "lib/gql"
import { sortBy } from "lodash"

const vortexSchema = executableVortexSchema({ removeRootFields: false })

const getMaxPrice = (thing: { listPrice: any }) => {
  if (!thing.listPrice) {
    return 0
  }
  return thing.listPrice.minor || thing.listPrice.maxPrice.minor
}

export const vortexStitchingEnvironment = (
  localSchema: GraphQLSchema,
  gravitySchema: GraphQLSchema
) => ({
  // The SDL used to declare how to stitch an object
  extensionSchema: gql`
    union AnalyticsRankedEntityUnion = Artwork | Show | Artist | ViewingRoom
    extend type AnalyticsPricingContext {
      appliedFiltersDisplay: String
    }
    extend type Artwork {
      pricingContext: AnalyticsPricingContext
    }
    extend type AnalyticsHistogramBin {
      minPrice(
        decimal: String = "."

        format: String = "%s%v"
        precision: Int = 0
        symbol: String
        thousand: String = ","
      ): String

      maxPrice(
        decimal: String = "."

        format: String = "%s%v"
        precision: Int = 0
        symbol: String
        thousand: String = ","
      ): String
    }
    extend type Partner {
      analytics: AnalyticsPartnerStats
    }
    extend type User {
      analytics: AnalyticsUserStats
    }
    extend type AnalyticsPartnerSalesStats {
      total(
        decimal: String = "."
        format: String = "%s%v"
        precision: Int = 0
        symbol: String
        thousand: String = ","
      ): String
    }
    extend type AnalyticsPartnerSalesTimeSeriesStats {
      total(
        decimal: String = "."
        format: String = "%s%v"
        precision: Int = 0
        symbol: String
        thousand: String = ","
      ): String
    }
    extend type AnalyticsRankedStats {
      entity: AnalyticsRankedEntityUnion
    }
  `,
  resolvers: {
    AnalyticsPricingContext: {
      appliedFiltersDisplay: {
        fragment: gql`
          ... on AnalyticsPricingContext {
            appliedFilters{
              dimension
              category
            }
          }
          ... on Artwork { artistNames }
        `,
        resolve: (parent, _args, _context, _info) =>
          filtersDescription(parent.appliedFilters, parent.artistNames),
      },
    },
    AnalyticsHistogramBin: {
      minPrice: {
        fragment: gql`
          ... on AnalyticsHistogramBin {
            minPriceCents
          }
        `,
        resolve: (parent, args, _context, _info) =>
          amount((_) => parent.minPriceCents).resolve({}, args),
      },
      maxPrice: {
        fragment: gql`
          ... on AnalyticsHistogramBin {
            maxPriceCents
          }
        `,
        resolve: (parent, args, _context, _info) =>
          amount((_) => parent.maxPriceCents).resolve({}, args),
      },
    },
    Artwork: {
      pricingContext: {
        fragment: gql`
          ... on Artwork {
            sizeScore
            editionSets {
              sizeScore
              listPrice {
                __typename
                ... on PriceRange {
                  minPrice {
                    minor
                  }
                  maxPrice {
                    minor
                  }
                }
                ... on Money {
                  minor
                }
              }
            }
            listPrice {
              __typename
              ... on PriceRange {
                minPrice {
                  minor
                }
                maxPrice {
                  minor
                }
              }
              ... on Money {
                minor
              }
            }
            artist {
              internalID
              disablePriceContext
            }
            category
            isForSale
            isPriceHidden
            isInAuction
            priceCurrency
            artists {
              internalID
            }
            artistNames
          }
        `,
        resolve: async (source, _, context, info) => {
          const {
            artist,
            artists,
            artistNames,
            category,
            editionSets,
            isForSale,
            isInAuction,
            isPriceHidden,
            priceCurrency,
            listPrice,
            sizeScore: mainSizeScore,
          } = source

          // Find edition with highest price
          const edition = sortBy(
            [
              { sizeScore: mainSizeScore, listPrice },
              ...(editionSets || []),
            ].filter((e) => e.sizeScore),
            getMaxPrice
          ).pop() as any

          if (!edition) {
            return null
          }

          const price = getMaxPrice(edition)
          const sizeScore = edition.sizeScore

          // fail if we don't have enough info to request a histogram
          if (
            isPriceHidden ||
            isInAuction ||
            priceCurrency !== "USD" ||
            (artists && artists.length > 1) ||
            !isForSale ||
            !price ||
            !artist ||
            !sizeScore ||
            !category
          ) {
            return null
          }

          if (artist.disablePriceContext) {
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

          const args = {
            artistId: artist.internalID,
            category: vortexSupportedCategory,
            sizeScore: Math.round(sizeScore),
          }

          try {
            const vortexContext = await info.mergeInfo.delegateToSchema({
              schema: vortexSchema,
              operation: "query",
              fieldName: "analyticsPricingContext",
              args,
              context,
              info,
            })
            // passing it down from Artwork so it can be used in appliedFiltersDisplay
            // as a way to work around the resolver only having access
            // to the data in AnalyticsPricingContext and not Artwork
            if (vortexContext) vortexContext.artistNames = artistNames

            return vortexContext
          } catch (e) {
            console.error(e)
            throw e
          }
        },
      },
    },
    Partner: {
      analytics: {
        fragment: gql`... on Partner {
          internalID
        }`,

        resolve: async (source, _, context, info) => {
          const args = { partnerId: source.internalID }
          return await info.mergeInfo.delegateToSchema({
            schema: vortexSchema,
            operation: "query",
            fieldName: "analyticsPartnerStats",
            args,
            context,
            info,
          })
        },
      },
    },
    User: {
      analytics: {
        fragment: gql`... on User {
          internalID
        }`,
        resolve: async (source, _, context, info) => {
          const args = { userId: source.internalID }
          return await info.mergeInfo.delegateToSchema({
            schema: vortexSchema,
            operation: "query",
            fieldName: "analyticsUserStats",
            args,
            context,
            info,
          })
        },
      },
    },
    AnalyticsPartnerSalesStats: {
      total: {
        fragment: gql`
          ... on AnalyticsPartnerSalesStats {
            totalCents
          }
        `,
        resolve: (parent, args, _context, _info) =>
          amount((_) => parent.totalCents).resolve({}, args),
      },
    },
    AnalyticsPartnerSalesTimeSeriesStats: {
      total: {
        fragment: gql`
          ... on AnalyticsPartnerSalesTimeSeriesStats {
            totalCents
          }
        `,
        resolve: (parent, args, _context, _info) =>
          amount((_) => parent.totalCents).resolve({}, args),
      },
    },
    AnalyticsRankedStats: {
      entity: {
        fragment: gql`
          ... on AnalyticsRankedStats {
            rankedEntity {
              __typename
              ... on AnalyticsArtwork {
                entityId
              }
              ... on AnalyticsShow {
                entityId
              }
              ... on AnalyticsArtist {
                entityId
              }
              ... on AnalyticsViewingRoom {
                entityId
              }
            }
          }
        `,
        resolve: (parent, _args, context, info) => {
          const removeVortexPrefix = (name) => name.replace("Analytics", "")
          const typename = parent.rankedEntity.__typename
          const typenameWithoutPrefix = removeVortexPrefix(typename)
          // Data massaging to allow for proper casing for query: viewingRoom, show, artwork, etc
          const fieldName =
            typenameWithoutPrefix.charAt(0).toLowerCase() +
            typenameWithoutPrefix.slice(1)
          const id = parent.rankedEntity.entityId
          const schema =
            fieldName == "viewingRoom" ? gravitySchema : localSchema

          return info.mergeInfo
            .delegateToSchema({
              schema: schema,
              operation: "query",
              fieldName,
              args: {
                id,
              },
              context,
              info,
              transforms: vortexSchema.transforms,
            })
            .then((response) => {
              response.__typename = removeVortexPrefix(typename)
              return response
            })
        },
      },
    },
  },
})

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

const categoryMap = {
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

const categoryPluralization = {
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

const dimensionStrings = {
  LARGE: "large",
  MEDIUM: "medium-sized",
  SMALL: "small",
}
