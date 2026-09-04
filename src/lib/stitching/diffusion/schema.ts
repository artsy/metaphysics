import { createDiffusionExecutor } from "./link"
import { wrapSchema, RenameTypes } from "@graphql-tools/wrap"
import type { SubschemaConfig } from "@graphql-tools/delegate"
import { readFileSync } from "fs"
import { buildSchema } from "graphql"

export const diffusionSubschemaConfig = (): SubschemaConfig => {
  const diffusionTypeDefs = readFileSync("src/data/diffusion.graphql", "utf8")

  // Remap the names of certain types from Diffusion to fit in the larger
  // metaphysics ecosystem.
  const remap = {}

  return {
    schema: buildSchema(diffusionTypeDefs, { assumeValidSDL: true }),
    executor: createDiffusionExecutor(),
    transforms: [
      new RenameTypes((name) => {
        const newName = remap[name] || name
        return newName
      }),
    ],
  }
}

export const executableDiffusionSchema = () =>
  wrapSchema(diffusionSubschemaConfig())
