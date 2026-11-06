import factories from "../api"

export default (opts) => {
  const { galaxyLoaderWithoutAuthenticationFactory } = factories(opts)
  const galaxyLoader = galaxyLoaderWithoutAuthenticationFactory

  return {
    galaxyAuctionHousesLoader: galaxyLoader("auction_houses"),
    galaxyFairsLoader: galaxyLoader("fairs"),
    galaxyGalleriesLoader: galaxyLoader("galleries"),
    galaxyGalleryLoader: galaxyLoader((id) => `galleries/${id}`),
  }
}
