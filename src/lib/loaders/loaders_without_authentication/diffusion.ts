import factories from "../api"

export default (opts) => {
  const { diffusionLoaderWithoutAuthenticationFactory } = factories(opts)
  const diffusionLoader = diffusionLoaderWithoutAuthenticationFactory

  return {
    auctionLotsLoader: diffusionLoader("lots"),
    auctionLotLoader: diffusionLoader((id) => `lots/${id}`),
    auctionCreatedYearRangeLoader: diffusionLoader("lots/created_dates"),
    auctionResultComparableAuctionResultsLoader: diffusionLoader(
      (id) => `lots/${id}/comparable_lots`
    ),
    comparableAuctionResultsLoader: diffusionLoader("comparable_lots"),
  }
}
