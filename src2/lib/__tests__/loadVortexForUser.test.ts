import { loadVortexForUser } from "lib/loadVortexForUser"

describe("loadVortexForUser", () => {
  const recommendations = [{ artist_id: "artist-1", score: 0.9 }]

  it("uses the user's loader and drops empty params", async () => {
    const userLoader = jest.fn().mockResolvedValue({ data: recommendations })
    const appLoader = jest.fn()
    const context: any = {
      authenticatedLoaders: { vortexArtistRecommendationsLoader: userLoader },
      unauthenticatedLoaders: { vortexArtistRecommendationsLoader: appLoader },
    }

    const result = await loadVortexForUser(
      context,
      "vortexArtistRecommendationsLoader",
      { user_id: undefined, version: null, limit: 50 }
    )

    expect(result).toEqual(recommendations)
    expect(userLoader).toHaveBeenCalledWith({ limit: 50 })
    expect(appLoader).not.toHaveBeenCalled()
  })

  it("uses the app loader for impersonated requests, so Vortex honours user_id", async () => {
    const userLoader = jest.fn()
    const appLoader = jest.fn().mockResolvedValue({ data: recommendations })
    const context: any = {
      xImpersonateUserID: "user-1",
      authenticatedLoaders: { vortexArtistRecommendationsLoader: userLoader },
      unauthenticatedLoaders: { vortexArtistRecommendationsLoader: appLoader },
    }

    await loadVortexForUser(context, "vortexArtistRecommendationsLoader", {
      user_id: "user-1",
    })

    expect(appLoader).toHaveBeenCalledWith({ user_id: "user-1" })
    expect(userLoader).not.toHaveBeenCalled()
  })

  it("throws without a loader", async () => {
    const context: any = {
      authenticatedLoaders: {},
      unauthenticatedLoaders: {},
    }

    await expect(
      loadVortexForUser(context, "vortexArtistRecommendationsLoader", {})
    ).rejects.toThrow("Authentication failed")
  })
})
