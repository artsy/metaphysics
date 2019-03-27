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

  // Resolvers for the above, this passes in ALL potential parameters
  // from KAWS into filter_artworks to allow end users to dynamically
  // modify query filters using an admin tool
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
            artist {
              _id
            }
            category
            is_price_hidden
          }
        `,
        resolve: async (source, _, context, info) => {
          const {
            widthCm,
            heightCm,
            artist,
            category,
            is_price_hidden,
          } = source
          // fail if we don't have enough info to request a histogram
          if (
            is_price_hidden ||
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
            category: category.toUpperCase(),
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
