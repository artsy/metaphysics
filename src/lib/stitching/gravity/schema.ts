import { createGravityLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  FilterTypes,
} from "graphql-tools"
import { readFileSync } from "fs"

export const executableGravitySchema = () => {
  const gravityTypeDefs = readFileSync("src/data/gravity.graphql", "utf8")

  const gravityLink = createGravityLink()
  const schema = makeRemoteExecutableSchema({
    schema: gravityTypeDefs,
    link: gravityLink,
  })

  // Types which come from Gravity which MP already has copies of.
  // In the future, these could get merged into the MP types.
  const removeTypes = [
    "Artist",
    "Artwork",
    "ArtistEdge",
    "ArtworkEdge",
    "ArtworkConnection",
    "ArtistConnection",
    "Partner",
  ]

  // Return the new modified schema
  return transformSchema(schema, [
    // Remove types which Metaphysics handles better
    new FilterTypes(type => {
      return !removeTypes.includes(type.name)
    }),
  ])
}
