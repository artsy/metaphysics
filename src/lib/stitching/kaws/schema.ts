import { createKawsExecutor } from "./link"
import { wrapSchema, RenameTypes, RenameRootFields } from "@graphql-tools/wrap"
import { loadSchema } from "@graphql-tools/load"
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader"

export const executableKawsSchema = async () => {
  const kawsExecutor = createKawsExecutor()

  // Setup the default Schema
  const schema = wrapSchema({
    schema: await loadSchema("src/data/kaws.graphql", {
      loaders: [new GraphQLFileLoader()],
    }),
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
  })

  return schema
}
