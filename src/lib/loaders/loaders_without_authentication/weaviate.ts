import factories from "../api"

interface GraphQLArgs {
  query: string
  variables?: any
}

export default (opts) => {
  const {
    weaviateLoaderWithoutAuthenticationFactory: weaviateLoader,
  } = factories(opts)

  return {
    weaviateGraphqlLoader: ({ query, variables }: GraphQLArgs) => {
      return weaviateLoader(
        "/graphql",
        { query, variables: JSON.stringify(variables) },
        {
          method: "POST",
        }
      )
    },
    weaviateCreateObjectLoader: weaviateLoader(
      (path) => `objects/${path}`,
      {},
      { method: "POST" }
    ),
    weaviateDeleteObjectLoader: weaviateLoader(
      (path) => `objects/${path}`,
      {},
      { method: "DELETE" }
    ),
    weaviateGetObjectLoader: weaviateLoader(
      (path) => path,
      {},
      { method: "GET" }
    ),
  }
}
