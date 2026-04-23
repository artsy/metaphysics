import { readFileSync } from "fs"
import {
  FilterRootFields,
  RenameRootFields,
  RenameTypes,
  wrapSchema,
} from "@graphql-tools/wrap"
import { linkToExecutor } from "lib/stitching/lib/linkToExecutor"
import { buildSchema } from "graphql"
import { createVortexLink } from "./link"

const removeRootFieldList = [
  "BigInt",
  "artistAffinities",
  "artistRecommendations",
  "marketPriceInsightsBatch",
  "newForYouRecommendations",
  "partnerStat",
  "pricingContext",
  "userStat",
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

export const executableVortexSchema = ({
  removeRootFields = true,
}: { removeRootFields?: boolean } = {}) => {
  const vortexLink = createVortexLink()
  const vortexTypeDefs = readFileSync("src/data/vortex.graphql", "utf8")

  return wrapSchema({
    schema: buildSchema(vortexTypeDefs, { assumeValidSDL: true }),
    executor: linkToExecutor(vortexLink),
    transforms: transformsForVortex({ removeRootFields }),
  })
}
