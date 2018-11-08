import { executableKawsSchema } from "../schema"
import {
  getTypesFromSchema,
  getRootFieldsFromSchema,
} from "lib/stitching/lib/getTypesFromSchema"
import { printSchema } from "graphql"

it("Does not include kaws core types", async () => {
  const kawsSchema = await executableKawsSchema()
  const kawsTypes = await getTypesFromSchema(kawsSchema)

  expect(kawsTypes).not.toContain("Collection")
  expect(kawsTypes).not.toContain("CollectionCategory")
  expect(kawsTypes).not.toContain("CollectionQuery")

  expect(kawsTypes).toContain("MarketingCollection")
})

it("Does not include the root query fields", async () => {
  const kawsSchema = await executableKawsSchema()
  const rootFields = await getRootFieldsFromSchema(kawsSchema)

  expect(rootFields).not.toContain("categories")
  expect(rootFields).not.toContain("collection")
  expect(rootFields).not.toContain("collections")
})

it("creates an SDL", async () => {
  const kawsSchema = await executableKawsSchema()
  expect(
    printSchema(kawsSchema, { commentDescriptions: true })
  ).toMatchSnapshot()
})
