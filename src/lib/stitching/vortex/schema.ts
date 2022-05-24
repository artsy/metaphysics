import { createVortexLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  RenameTypes,
  RenameRootFields,
  FilterRootFields,
} from "graphql-tools"
import { readFileSync } from "fs"

export const executableVortexSchema = ({
  removeRootFields = true,
}: { removeRootFields?: boolean } = {}) => {
  const vortexLink = createVortexLink()
  const vortexTypeDefs = readFileSync("src/data/vortex.graphql", "utf8")

  // Setup the default Schema
  const schema = makeRemoteExecutableSchema({
    schema: vortexTypeDefs,
    link: vortexLink,
  })

  const removeRootFieldList = [
    "BigInt",
    "artistAffinities",
    "artistRecommendations",
    "artistSparklines",
    "marketPriceInsightsBatch",
    "newForYouRecommendations",
    "partnerStat",
    "pricingContext",
    "userStat",
  ]

  // Return the new modified schema
  return transformSchema(schema, [
    // we don't want pricingContext to be a root query field, it is
    // accessible through artwork
    ...(removeRootFields
      ? [
          new FilterRootFields(
            (_operation, name) => !removeRootFieldList.includes(name)
          ),
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
  ])
}
