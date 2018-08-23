import { graphql, GraphQLSchema } from "graphql"
import gql from "lib/gql"

export const getTypesFromSchema = async (schema: GraphQLSchema) => {
  // An introspection query that pulls out the names of all types in the schema
  const q = gql`
    {
      __schema {
        types {
          name
        }
      }
    }
  `
  const response = await graphql(schema, q, null, null)
  // Throw an error to make it easy to read in the failing test
  if (response.errors) {
    throw new Error(
      `Got errors from GQL: ${JSON.stringify(response.errors, null, "  ")}`
    )
  }

  // Return the real data
  return response.data!.__schema.types.map(t => t.name)
}
