// @ts-check
import factories from "../api"

export default opts => {
  const { deltaLoaderWithoutAuthenticationFactory } = factories(opts)
  return { deltaLoader: deltaLoaderWithoutAuthenticationFactory("/") }
}
