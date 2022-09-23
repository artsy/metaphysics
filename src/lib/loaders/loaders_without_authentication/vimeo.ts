/**
 * Vimeo API Docs: https://developer.vimeo.com/api/reference
 */

import factories from "../api"

export const vimeoLoaders = (opts) => {
  const { vimeoLoaderWithoutAuthenticationFactory } = factories(opts)
  const vimeoLoader = vimeoLoaderWithoutAuthenticationFactory

  return {
    videoLoader: vimeoLoader((id) => `videos/${id}`),
  }
}
