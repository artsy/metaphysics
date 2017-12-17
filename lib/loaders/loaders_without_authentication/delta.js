// @ts-check
import factories from "../api"

export default requestIDs => {
  const { deltaLoaderWithoutAuthenticationFactory } = factories(requestIDs)
  return { deltaLoader: deltaLoaderWithoutAuthenticationFactory("/") }
}
