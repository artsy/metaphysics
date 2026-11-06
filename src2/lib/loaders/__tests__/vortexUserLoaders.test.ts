import vortexLoadersWithoutAuthentication from "lib/loaders/loaders_without_authentication/vortex"

const mockVortexLoaderFactory = jest.fn((path, _params?, _options?) => path)

jest.mock("lib/loaders/api", () => ({
  __esModule: true,
  default: () => ({
    vortexLoaderWithoutAuthenticationFactory: mockVortexLoaderFactory,
  }),
}))

// Impersonated (Braze) requests read one user's data with an app token, so
// it must never be shared through memcache.
describe("unauthenticated Vortex loaders for impersonated requests", () => {
  beforeAll(() => vortexLoadersWithoutAuthentication({}))

  const optionsFor = (path: string) =>
    mockVortexLoaderFactory.mock.calls.find(
      ([calledPath]) => calledPath === path
    )?.[2]

  it.each([
    "artist_recommendations",
    "artwork_recommendations",
    "new_for_you_recommendations",
  ])("skips the cache for %s", (path) => {
    expect(optionsFor(path)).toEqual({ skipCache: true })
  })

  it("posts to user_artist_affinities, which is never cached", () => {
    expect(optionsFor("user_artist_affinities")).toEqual({ method: "POST" })
  })
})
