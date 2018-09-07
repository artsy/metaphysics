import { graphql, GraphQLSchema } from "graphql"
import gql from "lib/gql"

/**
 * An introspection query that pulls out the names of all types in the schema
 */
export const getTypesFromSchema = async (schema: GraphQLSchema) => {
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

/**
 * An introspection query that pulls out the names of all root fields in the schema
 */
export const getRootFieldsFromSchema = async (schema: GraphQLSchema) => {
  const q = gql`
    query {
      __schema {
        queryType {
          name
          description
          fields {
            name
          }
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
  return response.data!.__schema.queryType.fields.map(t => t.name)
}

/**
 * An introspection query that pulls out the names of all mutations in a schema
 */
export const getMutationFieldsFromSchema = async (schema: GraphQLSchema) => {
  const q = gql`
    query {
      __schema {
        mutationType {
          fields {
            name
          }
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
  return response.data!.__schema.mutationType.fields.map(t => t.name)
}
