import factories from "../api"

export const vimeoLoaders = (accessToken, opts) => {
  const {
    gravityLoaderWithAuthenticationFactory,
    vimeoLoaderWithAuthenticationFactory,
  } = factories(opts)

  // Set up gravity loading for "me" to verify token
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)

  const gravityLoader = gravityLoaderWithAuthenticationFactory(
    gravityAccessTokenLoader
  )

  const gravityJWTCheckLoader = gravityLoader("me")

  // Decode token and use `roles` check
  const accessTokenRoleCheckLoader = (me) => {
    // TODO: What is the right role for a partner to access?
    if (!me.roles.includes("team")) {
      throw new Error(
        "User needs `team` role permissions to perform this action"
      )
    }

    return Promise.resolve(accessToken)
  }

  const vimeoAccessTokenLoader = () =>
    gravityJWTCheckLoader()
      .then(accessTokenRoleCheckLoader)
      .catch((error) => {
        throw new Error(error)
      })

  const vimeoLoader = vimeoLoaderWithAuthenticationFactory(
    vimeoAccessTokenLoader
  )

  return {
    /**
     * @docs: https://developer.vimeo.com/api/reference/videos#upload_video
     */
    uploadVideo: vimeoLoader(`me/videos`, {}, { method: "POST" }),
  }
}
