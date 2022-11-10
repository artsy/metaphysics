import factories from "../api"

export default (opts) => {
  const { vimeoLoaderWithoutAuthenticationFactory } = factories(opts)
  const vimeoLoader = vimeoLoaderWithoutAuthenticationFactory

  return {
    videoLoader: vimeoLoader((id) => `videos/${id}`),
  }
}
