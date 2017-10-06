// @ts-check

import factories from "../api"

export default requestID => {
  const { positronLoaderWithoutAuthenticationFactory } = factories(requestID)
  const positronLoader = positronLoaderWithoutAuthenticationFactory

  return {
    articlesLoader: positronLoader("articles"),
    articleLoader: positronLoader(id => `articles/${id}`),
  }
}
