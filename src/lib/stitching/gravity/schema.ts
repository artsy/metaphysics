import { createGravityLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  RenameTypes,
  FilterRootFields,
} from "graphql-tools"
import { readFileSync } from "fs"

export const executableGravitySchema = async () => {
  const gravityTypeDefs = readFileSync("src/data/gravity.graphql", "utf8")

  const gravityLink = createGravityLink()
  const schema = await makeRemoteExecutableSchema({
    schema: gravityTypeDefs,
    link: gravityLink,
  })

  // Remap the names of certain types from Gravity to fit in the larger
  // metaphysics ecosystem.
  const remap = {
    Artist: "GravityArtist",
    Artwork: "GravityArtwork",
    Partner: "GravityPartner",
  }

  // Gravity's GraphQL contains a bunch of objects and root fields that will conflict
  // with what we have in MP already, this lets us bring them in one by one
  const whitelistedRootFields = ["recordArtworkView"]

  // Return the new modified schema
  return transformSchema(schema, [
    new RenameTypes(name => {
      const newName = remap[name] || name
      return newName
    }),
    new FilterRootFields((_type, name) => {
      return whitelistedRootFields.includes(name)
    }),
  ])
}
