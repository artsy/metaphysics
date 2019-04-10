import { executableVortexSchema } from "./schema"
import { amount } from "schema/fields/money"

const vortexSchema = executableVortexSchema({ removePricingContext: false })

export const vortexStitchingEnvironment = () => ({
  // The SDL used to declare how to stitch an object
  extensionSchema: `
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
  `,
  resolvers: {
    AnalyticsHistogramBin: {
      minPrice: {
        fragment: `
          ... on AnalyticsHistogramBin {
            minPriceCents
          }
        `,
        resolve: (parent, args, _context, _info) =>
          amount(_ => parent.minPriceCents).resolve({}, args),
      },
      maxPrice: {
        fragment: `
          ... on AnalyticsHistogramBin {
            maxPriceCents
          }
        `,
        resolve: (parent, args, _context, _info) =>
          amount(_ => parent.maxPriceCents).resolve({}, args),
      },
    },
    Artwork: {
      pricingContext: {
        fragment: `
          ... on Artwork {
            widthCm
            heightCm
            priceCents {
              min
            }
            artist {
              _id
            }
            category
            is_for_sale
            is_price_hidden
            is_in_auction
            price_currency
            artists {
              _id
            }
          }
        `,
        resolve: async (source, _, context, info) => {
          const {
            artist,
            artists,
            category,
            heightCm,
            is_for_sale,
            is_in_auction,
            is_price_hidden,
            price_currency,
            priceCents,
            widthCm,
          } = source
          // fail if we don't have enough info to request a histogram

          if (
            is_price_hidden ||
            is_in_auction ||
            price_currency !== "USD" ||
            (artists && artists.length > 1) ||
            !is_for_sale ||
            !priceCents ||
            !artist ||
            !widthCm ||
            !heightCm ||
            !category
          ) {
            return null
          }
          // this feature is only enabled for lab users right now
          if (!context.meLoader) {
            return null
          }
          const me = await context.meLoader()
          if (
            !me.lab_features ||
            !me.lab_features.includes("Pricing Context")
          ) {
            return null
          }

          const args = {
            artistId: artist._id,
            category: categoryMap[category] || "OTHER",
            widthCm: Math.round(widthCm),
            heightCm: Math.round(heightCm),
          }

          try {
            return await info.mergeInfo.delegateToSchema({
              schema: vortexSchema,
              operation: "query",
              fieldName: "analyticsPricingContext",
              args,
              context,
              info,
            })
          } catch (e) {
            console.error(e)
            throw e
          }
        },
      },
    },
  },
})

const categoryMap = {
  Architecture: "ARCHITECTURE",
  "Books and Portfolios": "BOOKS_AND_PORTFOLIOS",
  "Design/Decorative Art": "DESIGN_DECORATIVE_ART",
  "Drawing, Collage or other Work on Paper":
    "DRAWING_COLAGE_OTHER_WORK_ON_PAPER",
  "Fashion Design and Wearable Art": "FASHON",
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
