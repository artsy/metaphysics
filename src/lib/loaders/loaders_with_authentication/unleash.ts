import factories from "../api"

export const unleashLoaders = (accessToken, opts) => {
  const accessTokenLoader = () => Promise.resolve(accessToken)
  const { unleashLoaderWithAuthenticationFactory } = factories(opts)

  const unleashLoader = unleashLoaderWithAuthenticationFactory(
    accessTokenLoader
  )

  // TODO: Check for admin role on me before executing loader

  return {
    adminCreateFeatureFlag: unleashLoader(
      `projects/default/features`,
      {},
      { method: "POST" }
    ),
    adminFeatureFlagsLoader: unleashLoader("features"),
    adminFeatureFlagLoader: unleashLoader((id) => `features/${id}`),
    adminProjectsLoader: unleashLoader("projects"),
    adminProjectLoader: unleashLoader((id) => `projects/${id}`),
  }
}
