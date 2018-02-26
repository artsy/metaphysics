// @ts-check
import factories from "../api"

export default requestIDs => {
  const { galaxyLoaderWithoutAuthenticationFactory } = factories(requestIDs)
  const galaxyLoader = galaxyLoaderWithoutAuthenticationFactory

  return {
    galaxyGalleriesLoader: galaxyLoader(id => `galleries/${id}`),
  }
}
