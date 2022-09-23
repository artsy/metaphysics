/**
 * Vimeo API Docs: https://developer.vimeo.com/api/reference
 */

import factories from "../api"
import { accessTokenByRoleLoader } from "./utils/accessTokenByRoleLoader"

export const vimeoLoaders = (accessToken, opts) => {
  const { vimeoLoaderWithAuthenticationFactory } = factories(opts)

  const { accessTokenLoader } = accessTokenByRoleLoader(
    // TODO: What role do partners updating artworks have?
    "team",
    accessToken,
    opts
  )

  const vimeoLoader = vimeoLoaderWithAuthenticationFactory(accessTokenLoader)

  return {
    /**
     * @see: https://developer.vimeo.com/api/reference/videos#upload_video
     */
    uploadVideo: vimeoLoader(`me/videos`, {}, { method: "POST" }),
  }
}
