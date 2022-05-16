import { getArtistAffinities } from "../artworksForUser"

const mockLoaderFactory = (affinities) => {
  const edges = affinities.map((affinity) => {
    return { node: { ...affinity } }
  })

  const data = { artistAffinities: { edges } }
  const loader = jest.fn(() => ({ data }))

  return loader
}

describe("getArtistAffinities", () => {
  const userLoader = mockLoaderFactory([{ artistId: "banksy", score: "7.77" }])
  const appLoader = mockLoaderFactory([{ artistId: "warhol", score: "9.99" }])

  it("prefers the user loader when available", async () => {
    const context = {
      vortexGraphqlLoader: () => userLoader,
      vortexGraphqlLoaderFactory: () => () => appLoader,
    } as any

    const artistIds = await getArtistAffinities({}, context)

    expect(artistIds).toEqual(["banksy"])
  })

  it("falls back to the app loader when there is no user loader", async () => {
    const context = {
      vortexGraphqlLoader: null,
      vortexGraphqlLoaderFactory: () => () => appLoader,
    } as any

    const artistIds = await getArtistAffinities({}, context)

    expect(artistIds).toEqual(["warhol"])
  })
})
