import factories from "../api"

interface GraphQLArgs {
  query: string
  variables?: any
}

export default (opts) => {
  const { vortexLoaderWithoutAuthenticationFactory } = factories(opts)

  return {
    vortexGraphqlLoaderWithoutAuthentication: ({
      query,
      variables,
    }: GraphQLArgs) => {
      return vortexLoaderWithoutAuthenticationFactory(
        "/graphql",
        { query, variables: JSON.stringify(variables) },
        {
          method: "POST",
        }
      )
    },
  }
}
