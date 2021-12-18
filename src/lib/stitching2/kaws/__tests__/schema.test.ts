import { executableKawsSchema } from "../schema"
import {
  getTypesFromSchema,
  getRootFieldsFromSchema,
} from "lib/stitching/lib/getTypesFromSchema"
import { printSchema } from "graphql"
import { stitchSchemas } from "@graphql-tools/stitch"
import { incrementalMergeSchemas2 } from "lib/stitching2/mergeSchemas"

it("Does not include kaws core types", async () => {
  const stitchedSchema = incrementalMergeSchemas2({})
  const kawsSchema = await executableKawsSchema()
  const schema = stitchSchemas({
    subschemas: [kawsSchema],
  })
  debugger
  const kawsTypes = await getTypesFromSchema(schema)

  expect(kawsTypes).not.toContain("Collection")
  expect(kawsTypes).not.toContain("CollectionCategory")
  expect(kawsTypes).not.toContain("CollectionQuery")

  expect(kawsTypes).toContain("MarketingCollection")
})

it("Does not include the root query fields", async () => {
  const kawsSchema = await executableKawsSchema()
  const rootFields = await getRootFieldsFromSchema(kawsSchema.schema)

  expect(rootFields).not.toContain("categories")
  expect(rootFields).not.toContain("collection")
  expect(rootFields).not.toContain("collections")
})

it("creates an SDL", async () => {
  const kawsSchema = await executableKawsSchema()
  expect(
    printSchema(kawsSchema.schema, { commentDescriptions: true })
  ).toMatchSnapshot()
})
