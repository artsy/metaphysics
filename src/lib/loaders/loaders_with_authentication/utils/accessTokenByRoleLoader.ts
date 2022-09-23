import factories from "lib/loaders/api"

export const accessTokenByRoleLoader = (
  role: string,
  accessToken: string,
  opts: any = {}
): { accessTokenLoader: () => Promise<string> } => {
  const { gravityLoaderWithAuthenticationFactory } = factories(opts)

  // Spin up a local gravity authenticated loader for validating JWT role
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)

  const gravityLoader = gravityLoaderWithAuthenticationFactory(
    gravityAccessTokenLoader
  )

  const gravityJWTCheckLoader = gravityLoader("me")

  // Decode token and use `roles` check
  const accessTokenRoleCheckLoader = (me) => {
    if (!me.roles.includes(role)) {
      throw new Error(
        `User needs '${role}' role permissions to perform this action`
      )
    }

    return Promise.resolve(accessToken)
  }

  const accessTokenLoader = () => {
    return gravityJWTCheckLoader()
      .then(accessTokenRoleCheckLoader)
      .catch((error) => {
        throw new Error(error)
      })
  }

  return { accessTokenLoader }
}
