// @ts-check
import factories from "../api"

export default opts => {
  const { galaxyLoaderWithoutAuthenticationFactory } = factories(opts)
  const galaxyLoader = galaxyLoaderWithoutAuthenticationFactory

  return {
    galaxyGalleriesLoader: galaxyLoader(id => {return `galleries/${id}`}),
  }
}
