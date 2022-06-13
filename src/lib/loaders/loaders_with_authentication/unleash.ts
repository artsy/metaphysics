import factories from "../api"

export const unleashLoaders = (accessToken, opts) => {
  const {
    gravityLoaderWithAuthenticationFactory,
    unleashLoaderWithAuthenticationFactory,
  } = factories(opts)

  // Set up gravity loading for "me" to verify token
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)

  const gravityLoader = gravityLoaderWithAuthenticationFactory(
    gravityAccessTokenLoader
  )

  const gravityJWTCheckLoader = gravityLoader("me")

  // Decode token and use `roles` check
  const accessTokenRoleCheckLoader = (me) => {
    if (!me.roles.includes("team")) {
      throw new Error(
        "User needs `team` role permissions to perform this action"
      )
    }

    return Promise.resolve(accessToken)
  }

  const unleashAccessTokenLoader = () =>
    gravityJWTCheckLoader()
      .then(accessTokenRoleCheckLoader)
      .catch((error) => {
        throw new Error(error)
      })

  const unleashLoader = unleashLoaderWithAuthenticationFactory(
    unleashAccessTokenLoader
  )

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
