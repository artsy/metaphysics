import factories from "../api"

export default (accessToken, opts) => {
  const positronAccessTokenLoader = () => Promise.resolve(accessToken)
  const { positronLoaderWithAuthenticationFactory } = factories(opts)
  const positronLoader = positronLoaderWithAuthenticationFactory(
    positronAccessTokenLoader
  )

  return {
    authenticatedArticleLoader: positronLoader((id) => `articles/${id}`),
  }
}
