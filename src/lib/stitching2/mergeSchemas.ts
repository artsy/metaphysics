import { GraphQLSchema } from "graphql"
import { executableKawsSchema } from "./kaws/schema"
import { kawsStitchingEnvironmentV2 } from "./kaws/v2/stitching"

const { stitchSchemas } = require("@graphql-tools/stitch")

export const incrementalMergeSchemas2 = async (localSchema) => {
  const subschemas = [localSchema] as GraphQLSchema[]
  const extensionResolvers = {} as any
  const extensionSchemas = [] as string[]

  const useStitchingEnvironment = ({ extensionSchema, resolvers }) => {
    extensionSchemas.push(extensionSchema)
    for (const [type, fieldResolvers] of Object.entries(
      resolvers as Record<string, Record<string, unknown>>
    )) {
      extensionResolvers[type] = {
        ...extensionResolvers[type],
        ...fieldResolvers,
      }
    }

    // debugger
  }

  const kawsSchema = await executableKawsSchema()
  subschemas.push(kawsSchema.schema)
  useStitchingEnvironment(
    kawsStitchingEnvironmentV2(localSchema, kawsSchema.schema)
  )

  const stitchedSchemas = stitchSchemas({
    subschemas,
    resolvers: extensionResolvers,
    typeDefs: extensionSchemas,
  })

  // debugger

  return stitchedSchemas
}
