// @ts-check

import factories from "../api"

export default opts => {
  const { positronLoaderWithoutAuthenticationFactory } = factories(opts)
  const positronLoader = positronLoaderWithoutAuthenticationFactory

  return {
    articlesLoader: positronLoader("articles"),
    articleLoader: positronLoader(id => `articles/${id}`),
  }
}
