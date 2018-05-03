import { createGravityLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  FilterTypes,
  FilterRootFields,
  RenameTypes,
} from "graphql-tools"
import { readFileSync } from "fs"

export const executableGravitySchema = async () => {
  const gravityTypeDefs = readFileSync("src/data/gravity.graphql", "utf8")

  const gravityLink = createGravityLink()
  const schema = await makeRemoteExecutableSchema({
    schema: gravityTypeDefs,
    link: gravityLink,
  })

  // Types which come from Gravity which MP already has copies of.
  // In the future, these could get merged into the MP types.
  const blacklistedTypes = ["Artist", "Artwork"]

  // Gravity's GraphQL contains a bunch of objects and root fields that will conflict
  // with what we have in MP already, this lets us bring them in one by one
  const whitelistedRootFields = ["Query", "recordArtworkView"]

  // Return the new modified schema
  return transformSchema(schema, [
    new FilterRootFields((_type, name) => {
      return !whitelistedRootFields.includes(name)
    }),
    new FilterTypes(type => {
      return !blacklistedTypes.includes(type.name)
    }),
    // So, we cannot remove all of the types from a schema is a lesson I have
    // learned in creating these transformations. This means that there has to
    // be at least one type still inside the Schema (excluding the Mutation or
    // the Query)

    // When Partner was removed, we'd see this error
    // https://github.com/graphcool/graphql-import/issues/73
    // but I don't think we're exhibiting the same bug.
    new RenameTypes(name => {
      if (name === "Partner") {
        return "DoNotUseThisPartner"
      }
      return name
    }),
  ])
}
