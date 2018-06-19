import { createStressLink } from "./link"
import {
  makeRemoteExecutableSchema,
  transformSchema,
  RenameTypes,
} from "graphql-tools"
import { readFileSync } from "fs"

export const executableStressSchema = async () => {
  const stressSDL = readFileSync("src/data/stress.graphql", "utf8")
  const stressLink = createStressLink()

  const schema = await makeRemoteExecutableSchema({
    schema: stressSDL,
    link: stressLink,
  })

  // Return the new modified schema
  return transformSchema(schema, [
    new RenameTypes(name => {
      return `Ecommerce${name}`
    }),
    // new TransformRootFields((operation, name, field) => {
    //   console.log(operation, name)
    //   if (operation == "Query") {
    //     return { name: `ecommerce_${name}`, field }
    //   } else {
    //     return { name, field }
    //   }
    // }),
  ])
}
