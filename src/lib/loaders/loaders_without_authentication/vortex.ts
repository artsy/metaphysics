import factories from "../api"

interface LoaderArgs {
  query: string
  variables?: any
}

export default (opts) => {
  const { vortexLoaderWithoutAuthenticationFactory } = factories(opts)

  return {
    vortexGraphqlLoader: ({ query, variables }: LoaderArgs) => {
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
