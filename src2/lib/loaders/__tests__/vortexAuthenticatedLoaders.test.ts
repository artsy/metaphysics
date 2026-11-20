import vortexLoaders from "lib/loaders/loaders_with_authentication/vortex"

const mockVortexRequest = jest.fn()

jest.mock("lib/loaders/api", () => ({
  __esModule: true,
  default: () => ({
    gravityLoaderWithAuthenticationFactory: () => () => () =>
      Promise.resolve({ token: "vortex-token" }),
    vortexLoaderWithAuthenticationFactory: () => (path, _params, options) => (
      params
    ) => mockVortexRequest(path, params, options),
  }),
}))

describe("marketPriceInsightsBatchLoader", () => {
  beforeEach(() => mockVortexRequest.mockReset())

  it("posts the pairs to the REST batch endpoint", async () => {
    mockVortexRequest.mockResolvedValue({ data: [] })
    const { marketPriceInsightsBatchLoader } = vortexLoaders("access-token", {})

    await marketPriceInsightsBatchLoader([
      { artistId: "artist-1", category: "Painting" },
    ])

    expect(mockVortexRequest).toHaveBeenCalledWith(
      "market_price_insights_batch",
      { tuples: [{ artist_id: "artist-1", medium: "Painting" }] },
      { method: "POST" }
    )
  })
})
