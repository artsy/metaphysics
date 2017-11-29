// @ts-check
import factories from "../api"

export default requestID => {
  const { diffusionLoaderWithoutAuthenticationFactory } = factories(requestID)
  const diffusionLoader = diffusionLoaderWithoutAuthenticationFactory

  return {
    auctionLotLoader: diffusionLoader("lots"),
  }
}
