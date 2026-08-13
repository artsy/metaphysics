import { readFileSync } from "fs"
import {
  FilterRootFields,
  FilterTypes,
  RenameRootFields,
  RenameTypes,
  wrapSchema,
} from "@graphql-tools/wrap"
import type { SubschemaConfig } from "@graphql-tools/delegate"
import { buildSchema } from "graphql"
import { createVortexExecutor } from "./link"

const removeRootFieldList = [
  "BigInt",
  "artistAffinities",
  "artistRecommendations",
  "artworkRecommendations",
  "marketPriceInsightsBatch",
  "newForYouRecommendations",
  "partnerStats",
  "pricingContext",
  "userStats",
]

// Types only reachable from the root fields above. Vortex still serves them
// over GraphQL for the loaders in `loaders_*/vortex.ts`, they just have no
// place in the merged schema.
const removeTypeList = [
  "ArtworkRecommendation",
  "ArtworkRecommendationConnection",
  "ArtworkRecommendationEdge",
]

export const transformsForVortex = ({ removeRootFields = true } = {}) => [
  // we don't want pricingContext to be a root query field, it is
  // accessible through artwork
  ...(removeRootFields
    ? [
        new FilterRootFields((_operation, name) => {
          if (!name) {
            return true
          }
          return !removeRootFieldList.includes(name)
        }),
        // Must stay paired with the root field filtering above: with the root
        // fields kept, these types are still reachable and dropping them would
        // leave an invalid schema.
        new FilterTypes((type) => !removeTypeList.includes(type.name)),
      ]
    : []),
  new RenameTypes((name) => {
    if (
      name.includes("PriceInsight") ||
      name.includes("PageCursor") ||
      ["BigInt", "ISO8601DateTime"].includes(name)
    ) {
      return name
    } else {
      return `Analytics${name}`
    }
  }),
  new RenameRootFields((_operation, name) => {
    if (["priceInsights", "marketPriceInsights"].includes(name)) {
      return name
    } else {
      return `analytics${name.charAt(0).toUpperCase() + name.slice(1)}`
    }
  }),
]

export const vortexSubschemaConfig = ({
  removeRootFields = true,
}: { removeRootFields?: boolean } = {}): SubschemaConfig => {
  const vortexTypeDefs = readFileSync("src/data/vortex.graphql", "utf8")

  return {
    schema: buildSchema(vortexTypeDefs, { assumeValidSDL: true }),
    executor: createVortexExecutor(),
    transforms: transformsForVortex({ removeRootFields }),
  }
}

export const executableVortexSchema = (
  opts: { removeRootFields?: boolean } = {}
) => wrapSchema(vortexSubschemaConfig(opts))
