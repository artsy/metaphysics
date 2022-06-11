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
    adminUpdateFeatureFlag: unleashLoader(
      (id) => `projects/default/features/${id}`,
      {},
      { method: "PUT" }
    ),
    adminDeleteFeatureFlag: unleashLoader(
      (id) => `projects/default/features/${id}`,
      {},
      { method: "DELETE" }
    ),
    addFeatureFlagStrategy: unleashLoader(
      ({
        id,
        environment,
      }: {
        id: string
        environment: "development" | "production"
      }) =>
        `projects/default/features/${id}/environments/${environment}/strategies`,
      {},
      { method: "POST" }
    ),
    addFeatureFlagVariant: unleashLoader(
      (id) => `projects/default/features/${id}/variants`,
      {},
      { method: "PUT" }
    ),
    adminToggleFeatureFlag: unleashLoader(
      ({
        id,
        environment,
        mode,
      }: {
        id: string
        environment: "development" | "production"
        mode: "on" | "off"
      }) =>
        `projects/default/features/${id}/environments/${environment}/${mode}`,
      {},
      { method: "POST" }
    ),

    adminFeatureFlagsLoader: unleashLoader("features"),
    adminFeatureFlagLoader: unleashLoader((id) => `features/${id}`),
    adminProjectsLoader: unleashLoader("projects"),
    adminProjectLoader: unleashLoader((id) => `projects/${id}`),
  }
}
