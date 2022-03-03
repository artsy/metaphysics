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

  const rootFieldsToFilter = [
    "pricingContext",
    "partnerStat",
    "pricingContext",
    "userStat",
  ]

  const filterTransform = new FilterRootFields(
    (_operation, name) => !rootFieldsToFilter.includes(name)
  )

  const typesToNotRename = ["BigInt", "ISO8601DateTime"]
  const patternToNotRename = new RegExp(/(PageCursor|PriceInsight)/)

  const renameTypesTransform = new RenameTypes((name) => {
    if (name.match(patternToNotRename) || typesToNotRename.includes(name)) {
      return name
    } else {
      return `Analytics${name}`
    }
  })

  const transforms = [
    ...(removeRootFields ? [filterTransform] : []),
    renameTypesTransform,
    new RenameRootFields((_operation, name) => {
      if (["priceInsights", "marketPriceInsights"].includes(name)) {
        return name
      } else {
        return `analytics${name.charAt(0).toUpperCase() + name.slice(1)}`
      }
    }),
  ]

  return transformSchema(schema, transforms)
}
