import factories from "../api"

interface LoaderArgs {
  query: string
  variables?: any
}

export default (opts) => {
  const { vortexLoaderWithAuthenticationFactory } = factories(opts)

  const setup = (appToken) => {
    return vortexLoaderWithAuthenticationFactory(() =>
      Promise.resolve(appToken)
    )
  }

  return {
    vortexGraphqlLoaderFactory: (appToken) => {
      return ({ query, variables }: LoaderArgs) => {
        return setup(appToken)(
          "/graphql",
          { query, variables: JSON.stringify(variables) },
          {
            method: "POST",
          }
        )
      }
    },
  }
}
