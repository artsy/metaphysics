import { createDiffusionLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  RenameTypes,
} from "graphql-tools"
import { readFileSync } from "fs"

export const executableDiffusionSchema = () => {
  const diffusionLink = createDiffusionLink()
  const diffusionTypeDefs = readFileSync("src/data/diffusion.graphql", "utf8")

  // Setup the default Schema
  const schema = makeRemoteExecutableSchema({
    schema: diffusionTypeDefs,
    link: diffusionLink,
  })

  // Remap the names of certain types from Diffusion to fit in the larger
  // metaphysics ecosystem.
  const remap = {}

  // Return the new modified schema
  return transformSchema(schema, [
    new RenameTypes((name) => {
      const newName = remap[name] || name
      return newName
    }),
  ])
}
