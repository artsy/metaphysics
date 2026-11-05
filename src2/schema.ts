import { readFileSync } from "fs"
import { join } from "path"
import { makeExecutableSchema } from "@graphql-tools/schema"
import { resolvers } from "./resolvers"

const typeDefs = readFileSync(join(__dirname, "artsy-schema.graphql"), "utf8")

export const schema = makeExecutableSchema({ typeDefs, resolvers })
