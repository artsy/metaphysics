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
  removePricingContext = true,
}: { removePricingContext?: boolean } = {}) => {
  const vortexLink = createVortexLink()
  const vortexTypeDefs = readFileSync("src/data/vortex.graphql", "utf8")

  // Setup the default Schema
  const schema = makeRemoteExecutableSchema({
    schema: vortexTypeDefs,
    link: vortexLink,
  })

  // Return the new modified schema
  return transformSchema(schema, [
    // we don't want pricingContext to be a root query field, it is
    // accessible through artwork
    ...(removePricingContext
      ? [new FilterRootFields((_operation, name) => name !== "pricingContext")]
      : []),
    new RenameTypes(name => {
      return `Analytics${name}`
    }),
    new RenameRootFields(
      (_operation, name) =>
        `analytics${name.charAt(0).toUpperCase() + name.slice(1)}`
    ),
  ])
}
