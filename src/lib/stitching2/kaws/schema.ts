import { createKawsExecutor } from "./link"
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader"
import { RenameTypes, RenameRootFields } from "@graphql-tools/wrap"
import { loadSchema } from "@graphql-tools/load"
import { GraphQLSchema } from "graphql"

export const executableKawsSchema = async () => {
  const kawsExecutor = createKawsExecutor()
  const kawsSchema: GraphQLSchema = await loadSchema("src/data/kaws.graphql", {
    loaders: [new GraphQLFileLoader()],
  })

  const schema = {
    schema: kawsSchema,
    executor: kawsExecutor,
    transforms: [
      new RenameTypes((name) => {
        return `Marketing${name}`
      }),
      new RenameRootFields(
        (_operation, name) =>
          `marketing${name.charAt(0).toUpperCase() + name.slice(1)}`
      ),
    ],
  }

  return schema
}
