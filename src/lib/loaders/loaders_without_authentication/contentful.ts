import factories from "../api"

export default (opts) => {
  const { contentfulLoaderWithoutAuthenticationFactory } = factories(opts)
  const contentfulLoader = contentfulLoaderWithoutAuthenticationFactory

  return {
    contentfulArticleLoader: contentfulLoader((id) => `entries?sys.id=${id}`),
    contentfulArticlesLoader: contentfulLoader(`entries?content_type=article`),
  }
}
