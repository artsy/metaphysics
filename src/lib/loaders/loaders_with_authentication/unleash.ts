import factories from "../api"

export const unleashLoaders = (accessToken, opts) => {
  const accessTokenLoader = () => Promise.resolve(accessToken)
  const { unleashLoaderWithAuthenticationFactory } = factories(opts)
  const unleashLoader = unleashLoaderWithAuthenticationFactory(
    accessTokenLoader
  )

  return {
    adminFeaturesLoader: unleashLoader("features"),
    adminFeatureLoader: unleashLoader((id) => `features/${id}`),
    adminProjectsLoader: unleashLoader("projects"),
    adminProjectLoader: unleashLoader((id) => `projects/${id}`),
  }
}
