import { executableGravitySchema } from "../schema"
import {
  getTypesFromSchema,
  getMutationFieldsFromSchema,
  getRootFieldsFromSchema,
} from "lib/stitching/lib/getTypesFromSchema"
import { printSchema } from "graphql"

it("Does not include gravity core types", async () => {
  const gravitySchema = await executableGravitySchema()
  const gravityTypes = await getTypesFromSchema(gravitySchema)

  expect(gravityTypes).not.toContain("Artist")
  expect(gravityTypes).not.toContain("Artwork")
  expect(gravityTypes).not.toContain("Partner")

  expect(gravityTypes).toContain("Mutation")
})

it("Includes the mutation recordArtworkView", async () => {
  const gravitySchema = await executableGravitySchema()
  const mutations = await getMutationFieldsFromSchema(gravitySchema)

  expect(mutations).toContain("recordArtworkView")
})

it("Does not include the root query fields", async () => {
  const gravitySchema = await executableGravitySchema()
  const rootFields = await getRootFieldsFromSchema(gravitySchema)

  expect(rootFields).not.toContain("artist")
  expect(rootFields).not.toContain("artists")
})

it("creates an SDL", async () => {
  const gravitySchema = await executableGravitySchema()
  expect(printSchema(gravitySchema, { commentDescriptions: true })).toBeTruthy()
})
