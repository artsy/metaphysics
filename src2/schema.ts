import { readFileSync } from "fs"
import { join } from "path"
import { makeExecutableSchema } from "@graphql-tools/schema"
import { resolvers } from "./resolvers"

const readSDL = (file: string) => readFileSync(join(__dirname, file), "utf8")

// Duplicate definitions (e.g. `type Query`) are merged by makeExecutableSchema.
const typeDefs = [
  readSDL("artsy-schema.graphql"),
  readSDL("artnet-schema.graphql"),
]

export const schema = makeExecutableSchema({ typeDefs, resolvers })
