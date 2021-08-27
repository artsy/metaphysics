import factories from "../api"

export default (opts) => {
  const { vortexLoaderWithoutAuthenticationFactory } = factories(opts)
  const vortexLoader = vortexLoaderWithoutAuthenticationFactory

  return {
    vortexUserLoader: vortexLoader((userId) => `/api/users/${userId}`),
  }
}
