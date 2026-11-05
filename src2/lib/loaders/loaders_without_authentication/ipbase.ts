import factories from "../api"

export default (opts) => {
  const { ipbaseLoaderWithoutAuthenticationFactory: factory } = factories(opts)
  const requestLocationLoader = factory("/v2/info", {}, { headers: true })

  return {
    requestLocationLoader,
  }
}
