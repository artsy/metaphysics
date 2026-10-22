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

const loadWithFlag = (useUnstitchedVortex: boolean) => {
  let loaders: any
  jest.isolateModules(() => {
    const actualConfig = jest.requireActual("config").default
    jest.doMock("config", () => ({
      __esModule: true,
      default: { ...actualConfig, USE_UNSTITCHED_VORTEX: useUnstitchedVortex },
    }))
    loaders = require("lib/loaders/loaders_with_authentication/vortex").default(
      "access-token",
      {}
    )
  })
  return loaders
}

describe("marketPriceInsightsBatchLoader", () => {
  beforeEach(() => mockVortexRequest.mockReset())

  it("posts to the REST endpoint when USE_UNSTITCHED_VORTEX is on", async () => {
    mockVortexRequest.mockResolvedValue({ data: [] })
    const { marketPriceInsightsBatchLoader } = loadWithFlag(true)

    await marketPriceInsightsBatchLoader([
      { artistId: "artist-1", category: "Painting" },
    ])

    expect(mockVortexRequest).toHaveBeenCalledWith(
      "market_price_insights_batch",
      { tuples: [{ artist_id: "artist-1", medium: "Painting" }] },
      { method: "POST" }
    )
  })

  it("queries Vortex GraphQL when USE_UNSTITCHED_VORTEX is off", async () => {
    mockVortexRequest.mockResolvedValue({
      data: { marketPriceInsightsBatch: {} },
    })
    const { marketPriceInsightsBatchLoader } = loadWithFlag(false)

    await marketPriceInsightsBatchLoader([
      { artistId: "artist-1", category: "Painting" },
    ])

    expect(mockVortexRequest).toHaveBeenCalledWith("/graphql", undefined, {
      method: "POST",
    })
  })
})
