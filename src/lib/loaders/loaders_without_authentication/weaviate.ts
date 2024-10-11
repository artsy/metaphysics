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
    weaviateCreateCrossReferenceLoader: weaviateLoader(
      (path) => `objects/InfiniteDiscoveryUsers/${path}`,
      {},
      { method: "POST" }
    ),
    weaviateCreateObjectLoader: weaviateLoader(
      () => "objects",
      {},
      { method: "POST" }
    ),
  }
}
