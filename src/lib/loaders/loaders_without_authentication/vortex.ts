import factories from "../api"

export const vortexLoaders = (opts) => {
  const { vortexLoaderWithoutAuthenticationFactory } = factories(opts)
  const vortexLoader = vortexLoaderWithoutAuthenticationFactory

  return {
    vortexGraphqlLoader: (body) =>
      vortexLoader("/api/graphql", body, {
        method: "POST",
      }),
    vortexUserLoader: vortexLoader((userId) => `/api/users/${userId}`),
  }
}
