// @ts-check
import factories from "../api"

export default opts => {
  const { diffusionLoaderWithoutAuthenticationFactory } = factories(opts)
  const diffusionLoader = diffusionLoaderWithoutAuthenticationFactory

  return {
    auctionLotLoader: diffusionLoader("lots"),
  }
}
