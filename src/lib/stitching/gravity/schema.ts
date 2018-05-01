import { createGravityLink } from "./link"
import { makeRemoteExecutableSchema } from "graphql-tools"
import { readFileSync } from "fs"

export const executableGravitySchema = async () => {
  const gravityTypeDefs = readFileSync("src/data/gravity.graphql", "utf8")

  const gravityLink = createGravityLink()
  return await makeRemoteExecutableSchema({
    schema: gravityTypeDefs,
    link: gravityLink,
  })
}
