import { createDiffusionExecutor } from "./link"
import {
  FilterRootFields,
  FilterTypes,
  RenameTypes,
  wrapSchema,
} from "@graphql-tools/wrap"
import type { SubschemaConfig } from "@graphql-tools/delegate"
import { readFileSync } from "fs"
import { buildSchema } from "graphql"

// Price insights moved from Diffusion to Vortex in 2021, but this copy of the
// Diffusion schema still declares them. Stitched last, Vortex used to win them;
// without the Vortex subschema, Diffusion would serve them instead of the
// native fields.
const removeRootFieldList = ["marketPriceInsights", "priceInsights"]
const removeTypeList = [
  "MarketPriceInsights",
  "PriceInsightConnection",
  "PriceInsightEdge",
  "PriceInsightSort",
]

export const diffusionSubschemaConfig = (): SubschemaConfig => {
  const diffusionTypeDefs = readFileSync("src/data/diffusion.graphql", "utf8")

  // Remap the names of certain types from Diffusion to fit in the larger
  // metaphysics ecosystem.
  const remap = {}

  return {
    schema: buildSchema(diffusionTypeDefs, { assumeValidSDL: true }),
    executor: createDiffusionExecutor(),
    transforms: [
      new FilterRootFields(
        (_operation, name) => !removeRootFieldList.includes(name)
      ),
      new FilterTypes((type) => !removeTypeList.includes(type.name)),
      new RenameTypes((name) => {
        const newName = remap[name] || name
        return newName
      }),
    ],
  }
}

export const executableDiffusionSchema = () =>
  wrapSchema(diffusionSubschemaConfig())
