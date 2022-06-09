import factories from "../api"

export const unleashLoaders = (_accessToken, opts) => {
  const { unleashLoaderWithAuthenticationFactory } = factories(opts)
  const unleashLoader = unleashLoaderWithAuthenticationFactory

  return {
    featuresLoader: unleashLoader("features"),
    featureLoader: unleashLoader((id) => `features/${id}`),
    projectsLoader: unleashLoader("projects"),
    projectLoader: unleashLoader((id) => `projects/${id}`),
  }
}
